import React, { createContext, useContext, useState, useEffect } from 'react';
import dbApi from '../api/dbApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hub_token') || null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchUserStats = async (userId) => {
    try {
      const userStats = await dbApi.getStats(userId);
      setStats(userStats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await dbApi.getUserFromToken(token);
          if (userData) {
            setUser(userData);
            // Chạy kiểm tra hàng ngày
            const checkResult = await dbApi.runDailyCheck(userData.id);
            if (checkResult) {
               console.log(checkResult.message);
               // Có thể hiển thị thông báo cho user
            }
            await fetchUserStats(userData.id);
          } else {
            // Token không hợp lệ
            localStorage.removeItem('hub_token');
            setToken(null);
          }
        } catch (error) {
          console.error("Auth init error:", error);
          localStorage.removeItem('hub_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);
  
  const login = async (username, password) => {
    const { token, user } = await dbApi.login(username, password);
    setToken(token);
    setUser(user);
    await fetchUserStats(user.id);
  };

  const signup = async (username, password) => {
    const { token, user } = await dbApi.signup(username, password);
    setToken(token);
    setUser(user);
    await fetchUserStats(user.id);
  };

  const logout = () => {
    dbApi.logout();
    setToken(null);
    setUser(null);
    setStats(null);
  };
  
  const updateStats = (newStats) => {
    setStats(newStats);
  };

  const value = {
    user,
    token,
    stats,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    updateStats, // Để cập nhật điểm khi cần
    refreshStats: () => fetchUserStats(user.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

