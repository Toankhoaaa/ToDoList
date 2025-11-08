import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import dbApi from '../api/dbApi';
import { callGeminiApi } from '../api/geminiApi';
import PomodoroTimer from '../components/PomodoroTimer';
import SimpleStopwatch from '../components/SimpleStopwatch';
import TaskItem from '../components/TaskItem';
import AddTaskForm from '../components/AddTaskForm';
import RewardPopup from '../components/RewardPopup';
import ProgressOverview from '../components/ProgressOverview';
import StatsDisplay from '../components/StatsDisplay';
import TaskSuggestionModal from '../components/TaskSuggestionModal';

const DashboardPage = () => {
  const { user, stats, refreshStats } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [hasCheckedCompletion, setHasCheckedCompletion] = useState(false);
  
  // State mới cho các tính năng AI
  const [breakingDownTaskId, setBreakingDownTaskId] = useState(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  // --- Reminder logic ---
  const REMINDER_BEFORE_START_MS = 5 * 60 * 1000; // 5 phút trước startTime
  const REMINDER_BEFORE_DEADLINE_MS = 5 * 60 * 1000; // 5 phút trước deadline
  const REMINDER_DURING_WORK_MS = 10 * 1000; // 10 giây trong quá trình làm việc
  const remindersKey = `hub_reminders_${user.id}`;
  const timersRef = useRef({}); // taskId -> { startTimer, deadlineTimer, workTimer }
  const workTimersRef = useRef({}); // taskId -> intervalId cho nhắc nhở 10 giây
  const tasksRef = useRef(tasks); // Ref để lưu tasks hiện tại cho interval

  const showNotification = (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  const clearAllReminders = (taskId) => {
    try {
      // Clear tất cả timers cho task
      if (timersRef.current[taskId]) {
        if (timersRef.current[taskId].startTimer) {
          clearTimeout(timersRef.current[taskId].startTimer);
        }
        if (timersRef.current[taskId].deadlineTimer) {
          clearTimeout(timersRef.current[taskId].deadlineTimer);
        }
        delete timersRef.current[taskId];
      }
      // Clear work timer (interval)
      if (workTimersRef.current[taskId]) {
        clearInterval(workTimersRef.current[taskId]);
        delete workTimersRef.current[taskId];
      }
    } catch (e) {
      console.error("clearAllReminders error", e);
    }
  };

  const scheduleReminders = (task) => {
    if (!task || task.completed) return;
    
    clearAllReminders(task.id);
    
    const now = Date.now();
    const reminders = {};

    // 1. Nhắc nhở trước startTime 5 phút
    if (task.startTime) {
      const startTime = new Date(task.startTime).getTime();
      const reminderTime = startTime - REMINDER_BEFORE_START_MS;
      if (reminderTime > now) {
        reminders.startTimer = setTimeout(() => {
          const taskText = task.text.length > 30 ? task.text.substring(0, 30) + '...' : task.text;
          showNotification('Nhắc nhở', `Công việc "${taskText}" sẽ bắt đầu sau 5 phút!`);
        }, reminderTime - now);
      }
    }

    // 2. Nhắc nhở trước deadline 5 phút
    if (task.deadline) {
      const deadline = new Date(task.deadline).getTime();
      const reminderTime = deadline - REMINDER_BEFORE_DEADLINE_MS;
      if (reminderTime > now) {
        reminders.deadlineTimer = setTimeout(() => {
          const taskText = task.text.length > 30 ? task.text.substring(0, 30) + '...' : task.text;
          showNotification('Nhắc nhở Deadline', `Công việc "${taskText}" còn 5 phút nữa đến hạn!`);
        }, reminderTime - now);
      }
    }

    // 3. Nhắc nhở trong quá trình làm việc (10 giây 1 lần) - chỉ khi task đang active
    if (task.isActive && !task.completed) {
      const taskId = task.id;
      const taskText = task.text.length > 30 ? task.text.substring(0, 30) + '...' : task.text;
      workTimersRef.current[taskId] = setInterval(() => {
        // Kiểm tra lại task từ ref hiện tại (luôn cập nhật)
        const currentTask = tasksRef.current.find(t => t.id === taskId);
        if (!currentTask || currentTask.completed || !currentTask.isActive) {
          if (workTimersRef.current[taskId]) {
            clearInterval(workTimersRef.current[taskId]);
            delete workTimersRef.current[taskId];
          }
          return;
        }
        showNotification('Đang làm việc', `Bạn đang làm: "${taskText}"`);
      }, REMINDER_DURING_WORK_MS);
    }

    if (Object.keys(reminders).length > 0) {
      timersRef.current[task.id] = reminders;
    }
  };

  // Xin quyền thông báo khi mount
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Cập nhật tasksRef khi tasks thay đổi
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Lên lịch reminders cho tất cả tasks khi tasks thay đổi
  useEffect(() => {
    tasks.forEach(task => {
      scheduleReminders(task);
    });

    // Cleanup on unmount
    return () => {
      Object.values(timersRef.current).forEach(timers => {
        if (timers.startTimer) clearTimeout(timers.startTimer);
        if (timers.deadlineTimer) clearTimeout(timers.deadlineTimer);
      });
      Object.values(workTimersRef.current).forEach(id => clearInterval(id));
      timersRef.current = {};
      workTimersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // Lấy tasks khi component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await dbApi.getTasks(user.id);
        setTasks(fetchedTasks);
        
        // Kiểm tra xem đã hoàn thành 100% chưa
        const allCompleted = fetchedTasks.length > 0 && fetchedTasks.every(t => t.completed);
        if (allCompleted) {
          setHasCheckedCompletion(true);
        }
        
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user.id]);

  // Kiểm tra hoàn thành task để hiện popup Reward
  useEffect(() => {
    if (tasks.length > 0 && !hasCheckedCompletion) {
      const allCompleted = tasks.every(t => t.completed);
      if (allCompleted) {
        setShowReward(true);
        setHasCheckedCompletion(true);
        // Logic 80% được xử lý ở daily check, 
        // ở đây ta thưởng cho 100%
      }
    }
  }, [tasks, hasCheckedCompletion]);

  const handleAddTask = async (text, deadline, startTime) => {
    try {
      const newTask = await dbApi.addTask(user.id, text, deadline, startTime);
      setTasks(prevTasks => [...prevTasks, newTask]);
      setHasCheckedCompletion(false); // Reset khi thêm task mới
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleToggleTask = async (taskId, updates) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Nếu đánh dấu hoàn thành và task đang active, tính thời gian đã làm
      if (updates.hasOwnProperty('completed') && updates.completed && task.isActive && task.activeStartTime) {
        const startTime = new Date(task.activeStartTime).getTime();
        const endTime = Date.now();
        const activeMinutes = Math.floor((endTime - startTime) / (1000 * 60));
        const newTotalActiveMinutes = (task.totalActiveMinutes || 0) + activeMinutes;
        updates.totalActiveMinutes = newTotalActiveMinutes;
        updates.isActive = false;
        updates.activeStartTime = null;
      }
      
      const updatedTask = await dbApi.updateTask(user.id, taskId, updates);
      setTasks(prevTasks => prevTasks.map(t => (t.id === taskId ? updatedTask : t)));

      // Nếu task hoàn thành, clear tất cả reminders
      if (updates.hasOwnProperty('completed') && updates.completed) {
        clearAllReminders(taskId);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // Hàm để đánh dấu task đang active (bắt đầu làm việc)
  const handleStartTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const now = new Date().toISOString();
      const updatedTask = await dbApi.updateTask(user.id, taskId, { 
        isActive: true,
        activeStartTime: now
      });
      setTasks(prevTasks => prevTasks.map(t => (t.id === taskId ? updatedTask : t)));
    } catch (error) {
      console.error("Failed to start task:", error);
    }
  };

  // Hàm để dừng task (tạm dừng làm việc)
  const handleStopTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.activeStartTime) return;
      
      // Tính thời gian đã làm
      const startTime = new Date(task.activeStartTime).getTime();
      const endTime = Date.now();
      const activeMinutes = Math.floor((endTime - startTime) / (1000 * 60)); // Chuyển sang phút
      const newTotalActiveMinutes = (task.totalActiveMinutes || 0) + activeMinutes;
      
      const updatedTask = await dbApi.updateTask(user.id, taskId, { 
        isActive: false,
        activeStartTime: null,
        totalActiveMinutes: newTotalActiveMinutes
      });
      setTasks(prevTasks => prevTasks.map(t => (t.id === taskId ? updatedTask : t)));
      
      // Clear work timer
      if (workTimersRef.current[taskId]) {
        clearInterval(workTimersRef.current[taskId]);
        delete workTimersRef.current[taskId];
      }
    } catch (error) {
      console.error("Failed to stop task:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await dbApi.deleteTask(user.id, taskId);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      // Xóa tất cả reminders
      clearAllReminders(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handlePomodoroComplete = async () => {
    try {
      await dbApi.logPomodoroSession(user.id);
      refreshStats(); // Cập nhật lại stats (gồm totalPomodoros)
    } catch (error) {
      console.error("Failed to log pomodoro:", error);
    }
  };

  // --- HÀM MỚI: Xử lý chia nhỏ task bằng AI ---
  const handleBreakdownTask = async (taskToBreakdown) => {
    if (breakingDownTaskId) return; // Đang xử lý task khác
    
    setBreakingDownTaskId(taskToBreakdown.id);
    try {
      // 1. Gọi Gemini
      const prompt = `Hãy chia nhỏ công việc sau thành các công việc con thực tế, chỉ trả lời bằng danh sách các công việc, mỗi công việc trên một dòng, không có gạch đầu dòng hay đánh số, không thêm lời giới thiệu: "${taskToBreakdown.text}"`;
      const resultText = await callGeminiApi(prompt);
      
      // 2. Parse kết quả
      const subTasks = resultText.split('\n').filter(t => t.trim().length > 0);
      
      if (subTasks.length === 0) {
        throw new Error("AI không thể chia nhỏ task này.");
      }

      // 3. Thêm các task con mới
      for (const subTaskText of subTasks) {
        await handleAddTask(`[${taskToBreakdown.text.substring(0, 15)}...] ${subTaskText}`, taskToBreakdown.deadline, taskToBreakdown.startTime);
      }

      // 4. Xóa task cha
      await handleDeleteTask(taskToBreakdown.id);

    } catch (error) {
      console.error("Failed to breakdown task:", error);
      alert("Lỗi khi chia nhỏ công việc. Vui lòng thử lại."); 
    } finally {
      setBreakingDownTaskId(null); // Hoàn tất
    }
  };


  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <RewardPopup isOpen={showReward} onClose={() => setShowReward(false)} streak={stats?.streak || 0} />
      
      {/* Modal gợi ý AI */}
      <TaskSuggestionModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        onAddTasks={(tasksTextArray) => {
          tasksTextArray.forEach(text => handleAddTask(text, null, null));
          setIsSuggestModalOpen(false);
        }}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cột chính (Tasks) */}
        <div className="lg:col-span-2 space-y-6">
          <StatsDisplay />
          
          {/* NÚT MỚI GỌI GEMINI */}
          <button
            onClick={() => setIsSuggestModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-600 hover:to-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Sparkles size={20} />
            ✨ Gợi ý nhiệm vụ với AI
          </button>
          
          <AddTaskForm onAddTask={handleAddTask} />
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Nhiệm vụ hôm nay</h2>
            {/* THAY THẾ ProgressBar BẰNG ProgressOverview MỚI */}
            <ProgressOverview tasks={tasks} stats={stats} />
            {loading ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Đang tải nhiệm vụ...</p>
            ) : tasks.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Chưa có nhiệm vụ nào cho hôm nay. Thêm một cái nhé!</p>
            ) : (
              <ul className="space-y-3 mt-4">
                {tasks.filter(t => !t.completed).map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={handleToggleTask} 
                    onDelete={handleDeleteTask}
                    onBreakdown={handleBreakdownTask}
                    isBreakingDown={breakingDownTaskId === task.id}
                    onStartTask={handleStartTask}
                    onStopTask={handleStopTask}
                  />
                ))}
                {tasks.filter(t => t.completed).length > 0 && (
                  <li className="pt-4">
                     <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Đã hoàn thành</h3>
                  </li>
                )}
                 {tasks.filter(t => t.completed).map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={handleToggleTask} 
                    onDelete={handleDeleteTask}
                    onBreakdown={handleBreakdownTask}
                    isBreakingDown={breakingDownTaskId === task.id}
                    onStartTask={handleStartTask}
                    onStopTask={handleStopTask}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Cột phụ (Pomodoro) */}
        <div className="lg:col-span-1 space-y-6">
          <PomodoroTimer onSessionComplete={handlePomodoroComplete} />
          {/* Thêm đồng hồ bấm giờ phụ mới ở đây */}
          <SimpleStopwatch />
          {/* Có thể thêm các widget khác ở đây */}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

