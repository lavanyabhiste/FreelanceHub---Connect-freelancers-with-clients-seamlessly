import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../services/notificationService';

// ── Async Thunks ────────────────────────────────────────────────────────────
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (params, { rejectWithValue }) => {
    try { return await notificationService.getNotifications(params); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try { return await notificationService.getUnreadCount(); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try { return await notificationService.markAsRead(id); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try { await notificationService.markAllAsRead(); return true; }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, { rejectWithValue }) => {
    try { await notificationService.deleteNotification(id); return id; }
    catch (e) { return rejectWithValue(e.message); }
  }
);

// ── Slice ───────────────────────────────────────────────────────────────────
const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    total: 0,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearNotificationError: (state) => { state.error = null; },
    // Real-time notification pushed from Socket.IO
    pushNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
      if (state.items.length > 50) state.items.pop();
    },
    // Real-time unread count sync
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload.notifications;
        state.unreadCount = payload.unreadCount;
        state.total = payload.total;
        state.totalPages = payload.totalPages;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchUnreadCount.fulfilled, (state, { payload }) => {
        state.unreadCount = payload.unreadCount;
      })

      .addCase(markNotificationRead.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex((n) => n._id === payload.notification._id);
        if (idx !== -1) {
          state.items[idx] = payload.notification;
          if (state.unreadCount > 0) state.unreadCount -= 1;
        }
      })

      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
      })

      .addCase(deleteNotification.fulfilled, (state, { payload }) => {
        const removed = state.items.find((n) => n._id === payload);
        if (removed && !removed.isRead && state.unreadCount > 0) state.unreadCount -= 1;
        state.items = state.items.filter((n) => n._id !== payload);
      });
  },
});

export const { clearNotificationError, pushNotification, setUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;
