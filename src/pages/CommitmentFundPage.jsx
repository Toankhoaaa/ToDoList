import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import dbApi from '../api/dbApi';

const CommitmentFundPage = () => {
  const { user, stats, refreshStats } = useAuth();
  const [commitment, setCommitment] = useState(null);
  const [tasks, setTasks] = useState([]); // State mới để giữ task
  const [selectedIds, setSelectedIds] = useState(new Set()); // State mới cho các task được chọn
  const [loading, setLoading] = useState(true);
  const [wagerAmount, setWagerAmount] = useState(50);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Lấy cả commitment và tasks
        const commitData = await dbApi.getCommitment(user.id);
        setCommitment(commitData);
        
        // Chỉ lấy các task của ngày hôm nay
        const taskData = await dbApi.getTasks(user.id);
        setTasks(taskData);
        
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  // Handler mới để chọn/bỏ chọn task
  const handleToggleTaskSelection = (taskId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSetCommitment = async () => {
    if (selectedIds.size === 0) {
      alert("Bạn phải chọn ít nhất một nhiệm vụ để cam kết.");
      return;
    }
    if (wagerAmount <= 0) {
      alert("Số điểm cược phải lớn hơn 0");
      return;
    }
    if (stats.points < wagerAmount) {
      alert("Bạn không đủ điểm để cược");
      return;
    }
    
    try {
      const newCommitment = { 
        wager: wagerAmount, 
        streak: commitment.streak || 0, // Giữ streak cũ
        taskIds: Array.from(selectedIds) // Thêm các task ID
      };
      await dbApi.updateCommitment(user.id, newCommitment);
      setCommitment(newCommitment);
      setSelectedIds(new Set()); // Xóa lựa chọn
      alert(`Cam kết thành công! Cược ${wagerAmount} điểm cho ${selectedIds.size} nhiệm vụ.`);
    } catch (error) {
      console.error("Failed to set commitment:", error);
    }
  };

  const handleCancelCommitment = async () => {
     try {
      // Giữ lại streak, reset wager và taskIds
      const newCommitment = { wager: 0, streak: commitment.streak, taskIds: [] };
      await dbApi.updateCommitment(user.id, newCommitment);
      setCommitment(newCommitment);
      alert("Đã hủy cam kết.");
    } catch (error) {
      console.error("Failed to cancel commitment:", error);
    }
  };

  if (loading || !commitment || !stats || !tasks) {
    return <div className="text-center p-10 dark:text-white">Đang tải...</div>;
  }

  const hasActiveCommitment = commitment.wager > 0 && commitment.taskIds.length > 0;
  
  // Lọc các task đã cam kết
  const committedTasks = hasActiveCommitment 
    ? tasks.filter(t => commitment.taskIds.includes(t.id))
    : [];
    
  // Lọc các task có thể chọn (chưa hoàn thành và chưa cam kết)
  const availableTasks = hasActiveCommitment
    ? []
    : tasks.filter(t => !t.completed);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
        <div className="text-center">
          <Target size={48} className="mx-auto text-red-600" />
          <h1 className="text-3xl font-bold my-4 text-gray-900 dark:text-white">Quỹ Cam Kết</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Chọn các nhiệm vụ cụ thể và đặt cược điểm. Hoàn thành 100% nhiệm vụ đã chọn để tăng chuỗi.
            Đạt 3 ngày liên tiếp, bạn được hoàn lại số điểm đã cược. Nếu thất bại, bạn mất số điểm đó.
          </p>
          
          <div className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Số điểm hiện tại: <span className="text-blue-600 dark:text-blue-400">{stats.points}</span>
          </div>
        </div>

        {hasActiveCommitment ? (
          // --- GIAO DIỆN KHI ĐANG CÓ CAM KẾT ---
          <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200 text-center">Cam kết hiện tại</h3>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 my-4 text-center">{commitment.wager} điểm</p>
            <p className="text-lg text-blue-700 dark:text-blue-300 text-center mb-4">
              Chuỗi hiện tại: <span className="font-bold">{commitment.streak} / 3 ngày</span>
            </p>
            
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Nhiệm vụ đã cam kết:</h4>
            {committedTasks.length > 0 ? (
              <ul className="space-y-2">
                {committedTasks.map(task => (
                  <li key={task.id} className={`flex items-center p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${task.completed ? 'opacity-70' : ''}`}>
                    {task.completed ? <CheckCircle size={20} className="text-green-500 mr-3" /> : <Circle size={20} className="text-blue-500 mr-3" />}
                    <span className={`dark:text-gray-100 ${task.completed ? 'line-through' : ''}`}>{task.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 italic">Các nhiệm vụ đã cam kết (có thể của ngày hôm qua) không có ở đây.</p>
            )}
             
             <button
              onClick={handleCancelCommitment}
              className="mt-6 w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Hủy Cam Kết
            </button>
          </div>
        ) : (
          // --- GIAO DIỆN TẠO CAM KẾT MỚI ---
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Tạo cam kết mới</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Chuỗi cam kết hiện tại: {commitment.streak} ngày.
            </p>
            
            {/* Chọn nhiệm vụ */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">1. Chọn các nhiệm vụ để cam kết:</label>
              <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-600">
                {availableTasks.length > 0 ? availableTasks.map(task => (
                  <label key={task.id} className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                    <input 
                      type="checkbox"
                      checked={selectedIds.has(task.id)}
                      onChange={() => handleToggleTaskSelection(task.id)}
                      className="h-5 w-5 rounded text-blue-600 border-gray-300 dark:border-gray-500 dark:bg-gray-700 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-800 dark:text-gray-100">{task.text}</span>
                  </label>
                )) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 p-3">Bạn không có nhiệm vụ nào (chưa hoàn thành) để cam kết. Hãy quay lại Dashboard và thêm nhiệm vụ mới!</p>
                )}
              </div>
            </div>
            
            {/* Chọn số tiền cược */}
            <div className="mb-6">
              <label htmlFor="wagerAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">2. Nhập số điểm cược:</label>
              <input 
                id="wagerAmount"
                type="number"
                value={wagerAmount}
                onChange={(e) => setWagerAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full p-3 text-lg border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {wagerAmount > stats.points && (
                <p className="text-red-500 text-sm mt-2">Bạn không đủ điểm!</p>
              )}
            </div>

            <button
              onClick={handleSetCommitment}
              disabled={selectedIds.size === 0 || wagerAmount <= 0 || wagerAmount > stats.points}
              className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cam Kết {selectedIds.size} Nhiệm Vụ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommitmentFundPage;

