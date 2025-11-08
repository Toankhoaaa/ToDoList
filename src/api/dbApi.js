import { isToday, getYesterday } from '../utils/dateUtils';

// Mô phỏng BACKEND (localStorage)
const dbApi = {
  // Mô phỏng độ trễ của mạng
  delay: (ms = 500) => new Promise(res => setTimeout(res, ms)),

  // --- User Auth (Tương đương routes/auth.py) ---
  
  signup: async (username, password) => {
    await dbApi.delay(300);
    const users = JSON.parse(localStorage.getItem('hub_users') || '[]');
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      throw new Error('Tên người dùng đã tồn tại');
    }
    const newUser = { id: Date.now().toString(), username };
    // Không lưu password trong localStorage ở thực tế, đây chỉ là demo
    users.push(newUser);
    localStorage.setItem('hub_users', JSON.stringify(users));
    
    // Tạo dữ liệu mặc định cho user mới
    localStorage.setItem(`hub_stats_${newUser.id}`, JSON.stringify({
      points: 100,
      streak: 0,
      totalPomodoros: 0,
      lastLogin: new Date().toISOString()
    }));
    localStorage.setItem(`hub_tasks_${newUser.id}`, '[]');
    localStorage.setItem(`hub_commitment_${newUser.id}`, JSON.stringify({
      wager: 0,
      streak: 0
    }));
    return dbApi.login(username, password);
  },

  login: async (username, password) => {
    await dbApi.delay(300);
    const users = JSON.parse(localStorage.getItem('hub_users') || '[]');
    const user = users.find(u => u.username === username);
    // Bỏ qua kiểm tra password cho demo
    if (user) {
      const token = `mock-jwt-token-for-${user.id}`;
      localStorage.setItem('hub_token', token);
      return { token, user };
    }
    throw new Error('Tên người dùng hoặc mật khẩu không đúng');
  },

  logout: () => {
    localStorage.removeItem('hub_token');
  },

  getUserFromToken: async (token) => {
    await dbApi.delay(100);
    if (!token || !token.startsWith('mock-jwt-token-for-')) {
      return null;
    }
    const userId = token.split('-').pop();
    const users = JSON.parse(localStorage.getItem('hub_users') || '[]');
    const user = users.find(u => u.id === userId);
    return user || null;
  },

  // --- Task Management (Tương đương routes/task.py) ---

  getTasks: async (userId) => {
    await dbApi.delay(200);
    const tasks = JSON.parse(localStorage.getItem(`hub_tasks_${userId}`) || '[]');
    // Chỉ trả về các task của ngày hôm nay
    return tasks.filter(task => isToday(task.createdAt));
  },

  addTask: async (userId, text, deadline, startTime) => {
    await dbApi.delay(100);
    const allTasks = JSON.parse(localStorage.getItem(`hub_tasks_${userId}`) || '[]');
    const newTask = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      isActive: false, // Để track task đang được làm
      activeStartTime: null, // Thời điểm bắt đầu làm việc
      totalActiveMinutes: 0 // Tổng thời gian đã làm (phút)
    };
    // Chỉ lưu các task trong 3 ngày để tránh localStorage bị đầy
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const recentTasks = allTasks.filter(task => new Date(task.createdAt) > threeDaysAgo);
    
    recentTasks.push(newTask);
    localStorage.setItem(`hub_tasks_${userId}`, JSON.stringify(recentTasks));
    return newTask;
  },

  updateTask: async (userId, taskId, updates) => {
    await dbApi.delay(50);
    const allTasks = JSON.parse(localStorage.getItem(`hub_tasks_${userId}`) || '[]');
    let updatedTask = null;
    const newTasks = allTasks.map(task => {
      if (task.id === taskId) {
        updatedTask = { ...task, ...updates };
        return updatedTask;
      }
      return task;
    });
    localStorage.setItem(`hub_tasks_${userId}`, JSON.stringify(newTasks));
    return updatedTask;
  },

  deleteTask: async (userId, taskId) => {
    await dbApi.delay(50);
    const allTasks = JSON.parse(localStorage.getItem(`hub_tasks_${userId}`) || '[]');
    const newTasks = allTasks.filter(task => task.id !== taskId);
    localStorage.setItem(`hub_tasks_${userId}`, JSON.stringify(newTasks));
    return { success: true };
  },

  // --- Stats & Pomodoro (Tương đương routes/pomodoro.py & logic) ---

  getStats: async (userId) => {
    await dbApi.delay(100);
    const stats = JSON.parse(localStorage.getItem(`hub_stats_${userId}`) || '{}');
    return {
      points: 100,
      streak: 0,
      totalPomodoros: 0,
      lastLogin: null,
      ...stats
    };
  },
  
  updateStats: async (userId, newStats) => {
    await dbApi.delay(50);
    localStorage.setItem(`hub_stats_${userId}`, JSON.stringify(newStats));
    return newStats;
  },

  logPomodoroSession: async (userId) => {
    await dbApi.delay(100);
    const stats = await dbApi.getStats(userId);
    const newStats = { ...stats, totalPomodoros: (stats.totalPomodoros || 0) + 1 };
    return dbApi.updateStats(userId, newStats);
  },

  // --- Commitment Fund (Tương đương routes/commitment.py) ---

  getCommitment: async (userId) => {
    await dbApi.delay(100);
    const commitment = JSON.parse(localStorage.getItem(`hub_commitment_${userId}`) || '{}');
    return {
      wager: 0,
      streak: 0,
      taskIds: [], // THÊM MỚI: Mảng các ID task đã cam kết
      ...commitment
    };
  },

  updateCommitment: async (userId, newCommitment) => {
    await dbApi.delay(100);
    localStorage.setItem(`hub_commitment_${userId}`, JSON.stringify(newCommitment));
    return newCommitment;
  },
  
  // --- Logic "Cron Job" mô phỏng ---
  // Logic này chạy khi user đăng nhập, kiểm tra xem có phải ngày mới không
  runDailyCheck: async (userId) => {
    console.log("Running daily check...");
    const stats = await dbApi.getStats(userId);
    const today = new Date();

    if (!isToday(stats.lastLogin)) {
      console.log("New day detected! Processing yesterday's results.");
      // --- Xử lý logic của ngày hôm qua ---
      const yesterday = getYesterday();
      const allTasks = JSON.parse(localStorage.getItem(`hub_tasks_${userId}`) || '[]');
      
      // Lọc task của ngày hôm qua
      const yesterdayTasks = allTasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate.getDate() === yesterday.getDate() &&
                 taskDate.getMonth() === yesterday.getMonth() &&
                 taskDate.getFullYear() === yesterday.getFullYear();
      });

      const total = yesterdayTasks.length;
      const completed = yesterdayTasks.filter(t => t.completed).length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;
      
      let newStreak = stats.streak;
      let newPoints = stats.points;
      
      // 1. Xử lý Streak hoàn thành Task (>= 80% TẤT CẢ tasks)
      if (total > 0 && completionRate >= 80) {
        newStreak = (stats.streak || 0) + 1;
        newPoints = (stats.points || 100) + 10; // Thưởng 10 điểm
        console.log(`Task streak success: ${completionRate}%`);
      } else if (total > 0) {
        newStreak = 0; // Reset streak
        console.log(`Task streak reset: ${completionRate}%`);
      }

      // 2. Xử lý Quỹ Cam Kết (Logic được viết lại)
      const commitment = await dbApi.getCommitment(userId);
      let newCommitmentStreak = commitment.streak;

      if (commitment.wager > 0 && commitment.taskIds && commitment.taskIds.length > 0) {
        // User có một cam kết đang hoạt động với các task cụ thể
        const committedTaskIds = new Set(commitment.taskIds);
        
        // Tìm các task đó trong *tất cả* tasks (vì chúng có thể là của ngày hôm qua)
        const committedTasks = allTasks.filter(t => committedTaskIds.has(t.id)); 
        
        const committedTotal = committedTasks.length;
        const committedCompleted = committedTasks.filter(t => t.completed).length;
        
        // QUY TẮC MỚI: Phải hoàn thành 100% các task đã cam kết
        const commitmentSuccess = (committedTotal > 0 && committedCompleted === committedTotal);

        if (commitmentSuccess) {
          // Hoàn thành cam kết
          newCommitmentStreak = (commitment.streak || 0) + 1;
          console.log(`Commitment success. New streak: ${newCommitmentStreak}`);
          if (newCommitmentStreak >= 3) {
            newPoints += commitment.wager; // Hoàn lại tiền
            console.log(`Commitment 3-day streak! ${commitment.wager} points refunded.`);
            // Reset cam kết sau khi hoàn tiền
            await dbApi.updateCommitment(userId, { wager: 0, streak: 0, taskIds: [] });
          } else {
             // Thắng, nhưng chưa đủ 3 ngày. Reset wager/tasks, giữ streak
             await dbApi.updateCommitment(userId, { wager: 0, streak: newCommitmentStreak, taskIds: [] });
          }
        } else if (committedTotal > 0) {
          // Thất bại cam kết
          newPoints -= commitment.wager; // Mất tiền
          console.log(`Commitment failed. Lost ${commitment.wager} points.`);
          // Reset cam kết
          await dbApi.updateCommitment(userId, { wager: 0, streak: 0, taskIds: [] });
        }
      }
      
      // Cập nhật stats
      await dbApi.updateStats(userId, {
        ...stats,
        points: newPoints,
        streak: newStreak,
        lastLogin: today.toISOString()
      });

      return {
        message: total > 0 
          ? `Đã xử lý ngày hôm qua: ${completed}/${total} tasks. Tỷ lệ: ${completionRate.toFixed(0)}%` 
          : 'Ngày mới! Chúc bạn làm việc hiệu quả!',
        streakReset: total > 0 && completionRate < 80,
        streakIncreased: total > 0 && completionRate >= 80
      };
    }
    return null; // Không phải ngày mới
  }
};

export default dbApi;

