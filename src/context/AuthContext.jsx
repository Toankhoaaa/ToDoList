import React, { createContext, useContext, useState, useEffect } from 'react';
import dbApi from '../api/dbApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Authentication removed: use a default guest user so UI can access stats
  const [user, setUser] = useState({ id: 'guest', username: 'Khách' });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchUserStats = async (userId) => {
    try {
      const userStats = await dbApi.getStats(userId);
      setStats(userStats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Always initialize with guest user stats
      await fetchUserStats(user.id);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    // Reset to guest
    setUser({ id: 'guest', username: 'Khách' });
    setStats(null);
  };

  const updateStats = (newStats) => setStats(newStats);

  const value = {
    user,
    stats,
    isAuthenticated: false,
    loading,
    logout,
    updateStats,
    refreshStats: () => fetchUserStats(user.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

