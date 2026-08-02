// import { create } from 'zustand';

// const useAuthStore = create((set) => ({
//   user: null,
//   accessToken: localStorage.getItem('accessToken') || null,
//   isAuthenticated: !!localStorage.getItem('accessToken'),

//     login: (user, accessToken, refreshToken) => {
//     localStorage.setItem('accessToken', accessToken);
//     if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
//     set({ user, accessToken, isAuthenticated: true });
//   },

//   logout: () => {
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('refreshToken');
//     set({ user: null, accessToken: null, isAuthenticated: false });
//   },

//   setUser: (user) => set({ user }),
// }));

// export default useAuthStore;

import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true, // New loading flag to prevent page flicker

  // 1. Run this immediately when your main React App layout loads
  checkAuth: async () => {
    try {
      // Hit a protected backend route that checks the user profile
      // getCurrentUser responds with ApiResponse { data: req.user }, so the
      // user object is data.data (not data.user).
      const { data } = await axiosInstance.get('/users/getCurrentUser');
      set({ user: data.data, isAuthenticated: true, isInitializing: false });
    } catch {
      // Cookie is dead, missing, or expired
      set({ user: null, isAuthenticated: false, isInitializing: false });
    }
  },

  login: (user) => {
    // Look! No token parameters or localStorage.setItem here anymore!
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      // Hit your backend logout endpoint so it clears the cookie
      await axiosInstance.post('/users/logout');
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  }
}));

export default useAuthStore;
