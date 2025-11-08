import React, { useState } from 'react';
import { CheckCircle, Circle, Trash2, Sparkles, Loader2, Play, Square } from 'lucide-react';

const TaskItem = ({ task, onToggle, onDelete, onBreakdown, isBreakingDown, onStartTask, onStopTask }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(task.id);
    // Component sẽ tự unmount
  };
  
  const handleToggle = () => {
    onToggle(task.id, { completed: !task.completed });
  };
  
  const hasDeadline = task.deadline;
  const hasStartTime = task.startTime;
  const deadlineDate = hasDeadline ? new Date(task.deadline) : null;
  const startTimeDate = hasStartTime ? new Date(task.startTime) : null;
  const isOverdue = hasDeadline && !task.completed && deadlineDate < new Date();
  const isStartTimePassed = hasStartTime && startTimeDate < new Date();

  return (
    <li className={`flex items-center p-3 rounded-lg transition-all ${isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${task.completed ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} shadow-sm`}>
      <button onClick={handleToggle} className="flex-shrink-0">
        {task.completed ? (
          <CheckCircle size={24} className="text-green-500" />
        ) : (
          <Circle size={24} className="text-gray-400 dark:text-gray-500" />
        )}
      </button>
      <div className="ml-3 flex-grow">
        <span className={`text-gray-800 dark:text-gray-100 ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
          {task.text}
        </span>
        <div className="flex flex-col gap-1 mt-1">
          {hasStartTime && (
            <span className={`text-xs ${isStartTimePassed ? 'text-green-500 font-semibold' : 'text-blue-500 dark:text-blue-400'}`}>
              Bắt đầu: {startTimeDate.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              {isStartTimePassed && ' (Đã đến giờ!)'}
            </span>
          )}
          {hasDeadline && (
            <span className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
              Deadline: {deadlineDate.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              {isOverdue && ' (Quá hạn!)'}
            </span>
          )}
        </div>
      </div>
      {/* Nút bắt đầu/dừng làm việc */}
      {!task.completed && (
        <button
          onClick={() => task.isActive ? onStopTask(task.id) : onStartTask(task.id)}
          className={`ml-2 p-1 rounded-full transition-colors ${
            task.isActive 
              ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900' 
              : 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900'
          }`}
          title={task.isActive ? 'Dừng làm việc' : 'Bắt đầu làm việc'}
        >
          {task.isActive ? <Square size={18} /> : <Play size={18} />}
        </button>
      )}
      {/* NÚT CHIA NHỎ TASK (AI) MỚI */}
      <button
        onClick={() => onBreakdown(task)}
        disabled={isBreakingDown}
        className="ml-2 p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Chia nhỏ công việc ✨"
      >
        {isBreakingDown ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Sparkles size={18} />
        )}
      </button>
      <button
        onClick={handleDelete}
        className="ml-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </li>
  );
};

export default TaskItem;

