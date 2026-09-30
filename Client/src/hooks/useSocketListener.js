import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { pushNotification, fetchUnreadCount } from '../slices/notificationSlice';

/**
 * Global hook: connects Socket.IO while authenticated,
 * listens for real-time notifications and shows React Toastify toasts.
 * Mount once inside the router (App).
 */
export default function useSocketListener() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, token } = useSelector((s) => s.auth);
  const connectedRef = useRef(false);

  // Connect/disconnect with auth state
  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket();
      dispatch(fetchUnreadCount());
      connectedRef.current = true;
    } else if (connectedRef.current) {
      disconnectSocket();
      connectedRef.current = false;
    }
    return () => {
      if (!isAuthenticated) disconnectSocket();
    };
  }, [isAuthenticated, token, dispatch]);

  // Listen for incoming notifications → Redux + toast
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket() || connectSocket();
    if (!socket) return;

    const onNotification = (payload) => {
      dispatch(pushNotification(payload));

      // Don't toast own actions if the server included sender info we can filter on
      const title = payload.title || 'Notification';
      const msg = payload.message || '';

      if (payload.type === 'new_message') {
        toast.info(`💬 ${title}: ${msg}`);
      } else if (payload.type === 'application_approved') {
        toast.success(`✅ ${title}`);
      } else if (payload.type === 'application_rejected') {
        toast.info(`📨 ${title}`);
      } else if (payload.type === 'work_submitted') {
        toast.success(`🎉 ${title}`);
      } else if (payload.type === 'revision_requested') {
        toast.warning(`🔄 ${title}`);
      } else if (payload.type === 'project_completed') {
        toast.success(`🏆 ${title}`);
      } else if (payload.type === 'new_review') {
        toast.success(`⭐ ${title}`);
      } else if (payload.type === 'new_bid') {
        toast.info(`📨 ${title}`);
      } else {
        toast.info(title);
      }

      // Keep unread badge in sync
      dispatch(fetchUnreadCount());
    };

    socket.on('notification', onNotification);

    return () => {
      socket.off('notification', onNotification);
    };
  }, [isAuthenticated, dispatch]);

  // Refresh unread count when navigating between pages
  useEffect(() => {
    if (isAuthenticated) dispatch(fetchUnreadCount());
  }, [location.pathname, isAuthenticated, dispatch]);
}
