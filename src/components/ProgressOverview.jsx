import React, { useState, useEffect } from 'react';

const ProgressOverview = ({ tasks, stats }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Cập nhật thời gian hiện tại mỗi giây để tính thời gian đã làm real-time
  useEffect(() => {
    const hasActiveTask = tasks.some(t => t.isActive && t.activeStartTime);
    if (hasActiveTask) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000); // Cập nhật mỗi giây
      return () => clearInterval(interval);
    }
  }, [tasks]);
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Tính tổng thời gian dựa trên startTime và deadline
  const totalEstimatedMinutes = tasks.reduce((total, task) => {
    if (task.startTime && task.deadline) {
      const start = new Date(task.startTime).getTime();
      const end = new Date(task.deadline).getTime();
      const minutes = Math.max(0, Math.floor((end - start) / (1000 * 60)));
      return total + minutes;
    } else if (task.deadline) {
      // Nếu chỉ có deadline, ước tính từ bây giờ đến deadline
      const now = Date.now();
      const end = new Date(task.deadline).getTime();
      const minutes = Math.max(0, Math.floor((end - now) / (1000 * 60)));
      return total + minutes;
    } else if (task.startTime) {
      // Nếu chỉ có startTime, ước tính 1 giờ
      return total + 60;
    } else {
      // Nếu không có cả hai, ước tính 25 phút (1 pomodoro)
      return total + 25;
    }
  }, 0);
  
  // Tính thời gian đã làm: tổng totalActiveMinutes + thời gian đang active
  const doneMinutes = tasks.reduce((total, task) => {
    let taskMinutes = task.totalActiveMinutes || 0;
    
    // Nếu task đang active, cộng thêm thời gian từ activeStartTime đến hiện tại
    if (task.isActive && task.activeStartTime) {
      const startTime = new Date(task.activeStartTime).getTime();
      const activeMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
      taskMinutes += activeMinutes;
    }
    
    return total + taskMinutes;
  }, 0); 

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
      
      {/* Percentage */}
      <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
        {percentage.toFixed(0)}%
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {completedTasks} / {totalTasks} công việc đã hoàn thành
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* 2x2 Grid Stats */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-center">
        {/* Hàng 1 */}
        <div className="border-r border-gray-200 dark:border-gray-700 px-2">
          <span className="block text-3xl font-bold text-gray-800 dark:text-gray-100">{totalTasks}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Tổng công việc</span>
        </div>
        <div className="px-2">
          <span className="block text-3xl font-bold text-gray-800 dark:text-gray-100">{completedTasks}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Đã hoàn thành</span>
        </div>
        
        {/* Hàng 2 */}
        <div className="border-r border-gray-200 dark:border-gray-700 pt-4 px-2">
          <span className="block text-3xl font-bold text-gray-800 dark:text-gray-100">{totalEstimatedMinutes}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Tổng thời gian (phút)</span>
        </div>
        <div className="pt-4 px-2">
          <span className="block text-3xl font-bold text-gray-800 dark:text-gray-100">{doneMinutes}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Đã làm (phút)</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressOverview;

