import { configureStore } from '@reduxjs/toolkit';
import appReducer from '../slices/appSlice';
import authReducer from '../slices/authSlice';
import projectReducer from '../slices/projectSlice';
import freelancerReducer from '../slices/freelancerSlice';
import notificationReducer from '../slices/notificationSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    projects: projectReducer,
    freelancer: freelancerReducer,
    notifications: notificationReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
