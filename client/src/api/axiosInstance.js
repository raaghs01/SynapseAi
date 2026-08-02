// import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// const axiosInstance = axios.create({
//   baseURL: `${API_URL}/api/v1`,
//   withCredentials: true,
//   // withCredentials removed: our auth uses the auth-token header (set below),
//   // not cookies. withCredentials + CORS wildcard origin is rejected by browsers.
// });

// axiosInstance.interceptors.request.use((config) => {
//   const token = localStorage.getItem('accessToken');
//   if (token) {
//     config.headers['auth-token'] = token;
//   }
//   return config;
// });

// // axiosInstance.interceptors.response.use(
// //   (response) => response,
// //   (error) => {
// //     if (error.response?.status === 401) {
// //       localStorage.removeItem('accessToken');
// //       window.location.href = '/login';
// //     }
// //     return Promise.reject(error);
// //   }
// // );
// let refreshPromise = null;

// const clearSession = () => {
//   localStorage.removeItem('accessToken');
//   localStorage.removeItem('refreshToken');
//   const onAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(
//     (p) => window.location.pathname.startsWith(p)
//   );
//   if (!onAuthPage) window.location.href = '/login';
// };

// axiosInstance.interceptors.response.use(
//   (r) => r,
//   async (error) => {
//     const original = error.config;
//     if (error.response?.status !== 401 || original._retry) {
//       return Promise.reject(error);
//     }

//     const refreshToken = localStorage.getItem('refreshToken');
//     if (!refreshToken) {
//       clearSession();
//       return Promise.reject(error);
//     }

//     original._retry = true;

//     try {
//       // Bare axios, not axiosInstance — using the instance would send this
//       // request back through this same interceptor on failure.
//       refreshPromise =
//         refreshPromise ||
//         axios
//           .post(`${API_URL}/api/v1/users/refreshAccessToken`, { refreshToken })
//           .finally(() => {
//             refreshPromise = null;
//           });

//       const { data } = await refreshPromise;
//       localStorage.setItem('accessToken', data.data.accessToken);
//       localStorage.setItem('refreshToken', data.data.refreshToken);

//       original.headers['auth-token'] = data.data.accessToken;
//       return axiosInstance(original);
//     } catch (e) {
//       clearSession();
//       return Promise.reject(e);
//     }
//   }
// );


// export default axiosInstance;

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // Crucial: Tells the browser to send cookies along with requests
});

// Note: Request interceptor is gone! The browser attaches cookies automatically.

let refreshPromise = null;

const clearSession = () => {
  // If the session is dead, redirect them to login
  const onAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(
    (p) => window.location.pathname.startsWith(p)
  );
  if (!onAuthPage) window.location.href = '/login';
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    // If the error isn't a 401 (Unauthorized), or if we already tried retrying once, stop.
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      // Deduplicate simultaneous requests that hit a 401 at the exact same moment
      refreshPromise =
        refreshPromise ||
        axios
          .post(`${API_URL}/api/v1/users/refreshAccessToken`, {}, { withCredentials: true }) // Must include withCredentials here too!
          .finally(() => {
            refreshPromise = null;
          });

      // Wait for the backend to handle the refresh
      await refreshPromise;
      
      // Look: No localStorage code here anymore!
      // Your backend will automatically send a new 'Set-Cookie' header back.
      // The browser automatically updates its cookie jar.

      // Simply refire the original request. The browser will automatically attach the fresh cookie.
      return axiosInstance(original);
    } catch (e) {
      clearSession();
      return Promise.reject(e);
    }
  }
);

export default axiosInstance;
