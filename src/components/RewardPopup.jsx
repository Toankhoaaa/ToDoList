import React from 'react';
import { Award } from 'lucide-react';

const RewardPopup = ({ isOpen, onClose, streak }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl transform transition-all scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()} // Ngăn popup đóng khi click vào nội dung
      >
        <div className="text-center">
          <Award size={64} className="mx-auto text-yellow-500" />
          <h2 className="text-3xl font-bold mt-4 text-gray-900 dark:text-white">Tuyệt vời!</h2>
          <p className="text-lg mt-2 text-gray-600 dark:text-gray-300">
            Bạn đã hoàn thành tất cả nhiệm vụ hôm nay!
          </p>
          {streak > 1 && (
             <p className="text-xl font-semibold mt-4 text-blue-600 dark:text-blue-400">
              Chuỗi hoàn thành: {streak} ngày! 🔥
            </p>
          )}
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardPopup;

