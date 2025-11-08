import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const PomodoroTimer = ({ onSessionComplete }) => {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  const [minutes, setMinutes] = useState(workDuration);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  const intervalRef = useRef(null);

  // Tạo âm thanh báo
  const playSound = () => {
    try {
      // Tạo audio context để phát âm thanh
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Cấu hình âm thanh
      oscillator.frequency.value = 800; // Tần số 800Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Phát 3 lần với khoảng cách
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 800;
        oscillator2.type = 'sine';
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
      }, 300);

      setTimeout(() => {
        const oscillator3 = audioContext.createOscillator();
        const gainNode3 = audioContext.createGain();
        oscillator3.connect(gainNode3);
        gainNode3.connect(audioContext.destination);
        oscillator3.frequency.value = 800;
        oscillator3.type = 'sine';
        gainNode3.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator3.start(audioContext.currentTime);
        oscillator3.stop(audioContext.currentTime + 0.5);
      }, 600);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Cập nhật bộ đếm nếu thời lượng thay đổi khi không hoạt động
  useEffect(() => {
    if (!isActive && !isBreak) {
      setMinutes(workDuration);
      setSeconds(0);
    }
  }, [workDuration, isActive, isBreak]);

  useEffect(() => {
    if (!isActive && isBreak) {
      setMinutes(breakDuration);
      setSeconds(0);
    }
  }, [breakDuration, isActive, isBreak]);


  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s === 0) {
          setMinutes(m => {
            if (m === 0) {
              // Hết giờ
              clearInterval(intervalRef.current);
              setIsActive(false);
              
              if (isBreak) {
                // Hết giờ nghỉ
                playSound(); // Phát âm thanh báo
                new Notification('Pomodoro', { body: 'Giờ nghỉ đã hết! Quay lại làm việc nào!' });
                resetTimer(false); // Quay lại làm việc
                // Tự động bắt đầu timer làm việc sau 1 giây
                setTimeout(() => {
                  startTimer();
                }, 1000);
              } else {
                // Hết giờ làm việc
                playSound(); // Phát âm thanh báo
                new Notification('Pomodoro', { body: 'Hết giờ làm việc! Tới giờ nghỉ ngơi!' });
                onSessionComplete(); // Ghi log phiên
                resetTimer(true); // Bắt đầu giờ nghỉ
                // Tự động bắt đầu timer nghỉ sau 1 giây
                setTimeout(() => {
                  startTimer();
                }, 1000);
              }
              return 0;
            }
            return m - 1;
          });
          return 59;
        }
        return s - 1;
      });
    }, 1000);
    setIsActive(true);
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
  };

  const resetTimer = (startBreak = false) => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    if (startBreak) {
      setMinutes(breakDuration);
      setSeconds(0);
      setIsBreak(true);
    } else {
      setMinutes(workDuration);
      setSeconds(0);
      setIsBreak(false);
    }
  };
  
  // Xin quyền thông báo
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Clear interval khi component unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // Tính toán phần trăm dựa trên thời lượng động
  const totalDurationInSeconds = isBreak ? breakDuration * 60 : workDuration * 60;
  const elapsedInSeconds = totalDurationInSeconds - (minutes * 60 + seconds);
  const progressPercent = totalDurationInSeconds > 0 ? (elapsedInSeconds / totalDurationInSeconds) * 100 : 0;


  return (
    <div className={`p-6 rounded-lg shadow-lg ${isBreak ? 'bg-green-100 dark:bg-green-900' : 'bg-white dark:bg-gray-800'}`}>
      <h2 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-gray-100">
        {isBreak ? 'Giờ nghỉ ngơi ☕' : 'Tập trung làm việc 🎯'}
      </h2>
      
      {/* Inputs để chỉnh thời gian (chỉ hiển thị khi không chạy) */}
      {!isActive && (
        <div className="flex justify-center gap-4 mb-4">
          <div className="text-center">
            <label htmlFor="workDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Làm việc (phút)</label>
            <input
              id="workDuration"
              type="number"
              value={workDuration}
              onChange={(e) => setWorkDuration(Math.max(1, e.target.valueAsNumber || 1))}
              className="w-20 p-2 text-center border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-center">
            <label htmlFor="breakDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nghỉ (phút)</label>
            <input
              id="breakDuration"
              type="number"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Math.max(1, e.target.valueAsNumber || 1))}
              className="w-20 p-2 text-center border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      )}
      
      <div className="relative w-48 h-48 mx-auto mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-200 dark:text-gray-700"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className={isBreak ? "text-green-500" : "text-blue-600"}
            strokeWidth="10"
            strokeDasharray="282.74"
            strokeDashoffset={282.74 - (progressPercent / 100) * 282.74}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-gray-900 dark:text-white">{timeDisplay}</span>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        {!isActive ? (
          <button
            onClick={startTimer}
            className={`flex items-center justify-center w-24 px-4 py-2 font-semibold text-white rounded-lg shadow-md transition-colors ${isBreak ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 ${isBreak ? 'focus:ring-green-500' : 'focus:ring-blue-500'}`}
          >
            <Play size={20} className="mr-2" />
            Bắt đầu
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="flex items-center justify-center w-24 px-4 py-2 font-semibold text-white bg-yellow-500 rounded-lg shadow-md hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
          >
            <Pause size={20} className="mr-2" />
            Tạm dừng
          </button>
        )}
        <button
          onClick={() => resetTimer(false)}
          className="flex items-center justify-center px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;

