import React, { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { callGeminiApiWithJson } from '../api/geminiApi';

const TaskSuggestionModal = ({ isOpen, onClose, onAddTasks }) => {
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]); // [{ taskName: "..." }]
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError("Vui lòng nhập một mục tiêu.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    
    try {
      const prompt = `Với vai trò là một cố vấn học tập, hãy đề xuất một danh sách các công việc chi tiết cần làm để đạt được mục tiêu sau: "${goal}". Chỉ trả về các công việc chính.`;
      const result = await callGeminiApiWithJson(prompt);
      if (!result || result.length === 0) {
        setError("AI không thể tạo gợi ý cho mục tiêu này. Vui lòng thử lại.");
      } else {
        setSuggestions(result);
        // Tự động chọn tất cả task
        const allTaskNames = new Set(result.map(t => t.taskName));
        setSelectedTasks(allTaskNames);
      }
    } catch (err) {
      console.error(err);
      setError("Đã xảy ra lỗi khi gọi AI. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = (taskName) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskName)) {
        newSet.delete(taskName);
      } else {
        newSet.add(taskName);
      }
      return newSet;
    });
  };

  const handleAddSelected = () => {
    onAddTasks(Array.from(selectedTasks));
    // Reset state
    setGoal('');
    setSuggestions([]);
    setSelectedTasks(new Set());
    setError(null);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            Trợ lý AI Gợi Ý Nhiệm Vụ
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={24} />
          </button>
        </div>

        {!isLoading && suggestions.length === 0 && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">Nhập mục tiêu hoặc dự án của bạn (ví dụ: "Viết luận văn", "Học thi cuối kỳ", "Làm đồ án môn OOP"). AI sẽ giúp bạn chia nhỏ thành các nhiệm vụ cụ thể.</p>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ví dụ: Chuẩn bị thuyết trình môn Marketing..."
              className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleGenerate}
              className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Tạo gợi ý
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 size={48} className="animate-spin text-purple-500" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">AI đang suy nghĩ...</p>
          </div>
        )}

        {!isLoading && suggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Các nhiệm vụ được đề xuất cho: "{goal}"</h3>
            <div className="max-h-64 overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {suggestions.map((task) => (
                <label key={task.taskName} className="flex items-center p-3 bg-white dark:bg-gray-800 rounded shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.taskName)}
                    onChange={() => handleToggleTask(task.taskName)}
                    className="h-5 w-5 rounded text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="ml-3 text-gray-800 dark:text-gray-100">{task.taskName}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleAddSelected}
              disabled={selectedTasks.size === 0}
              className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Thêm {selectedTasks.size} nhiệm vụ đã chọn
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSuggestionModal;

