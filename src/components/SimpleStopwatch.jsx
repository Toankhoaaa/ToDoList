import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

const SimpleStopwatch = () => {
  const [time, setTime] = useState(0); // Tính bằng giây
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(0);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800">
      <h2 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-gray-100 flex items-center justify-center gap-2">
        <Timer size={22} className="text-indigo-500" /> Đồng hồ bấm giờ
      </h2>
      <div className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">
        {formatTime(time)}
      </div>
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleStartPause}
          className={`flex items-center justify-center w-28 px-4 py-2 font-semibold text-white rounded-lg shadow-md transition-colors ${isActive ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'} focus:outline-none focus:ring-2 focus:ring-offset-2`}
        >
          {isActive ? <Pause size={20} className="mr-2" /> : <Play size={20} className="mr-2" />}
          {isActive ? 'Tạm dừng' : 'Bắt đầu'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center justify-center px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

export default SimpleStopwatch;

