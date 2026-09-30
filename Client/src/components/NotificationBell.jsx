import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../slices/notificationSlice';
import { Notifications as BellIcon } from '@mui/icons-material';

const TYPE_ICONS = {
  new_bid: '📨',
  application_approved: '✅',
  application_rejected: '❌',
  new_message: '💬',
  work_submitted: '🎉',
  revision_requested: '🔄',
  project_completed: '🏆',
  new_review: '⭐',
};

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount, loading } = useSelector((s) => s.notifications);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Load notifications when opened
  useEffect(() => {
    if (open) dispatch(fetchNotifications({ limit: 15 }));
  }, [open, dispatch]);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { user } = useSelector((s) => s.auth);

  const handleItemClick = (notif) => {
    if (!notif.isRead) dispatch(markNotificationRead(notif._id));
    setOpen(false);

    // Navigate based on notification type + user role
    const role = user?.role;
    const home =
      role === 'Freelancer' ? '/freelancer/dashboard' :
      role === 'Admin' ? '/admin/dashboard' :
      '/client/dashboard';

    if (role === 'Admin') {
      navigate('/admin/disputes');
      return;
    }

    if (notif.relatedProject?._id || notif.relatedProject) {
      const projectId = notif.relatedProject?._id || notif.relatedProject;
      const chatTypes = ['new_message', 'application_approved', 'work_submitted', 'revision_requested'];
      if (role === 'Freelancer') {
        navigate(chatTypes.includes(notif.type)
          ? `/freelancer/chat/${projectId}`
          : `/freelancer/projects/${projectId}`);
      } else {
        navigate(chatTypes.includes(notif.type)
          ? `/client/chat/${projectId}`
          : `/client/projects/${projectId}`);
      }
    } else {
      navigate(home);
    }
  };

  const handleMarkAll = () => {
    dispatch(markAllNotificationsRead());
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        className="btn btn-outline-secondary rounded-circle position-relative d-flex align-items-center justify-content-center"
        style={{ width: 40, height: 40 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <BellIcon fontSize="small" />
        {unreadCount > 0 && (
          <span
            className="position-absolute badge rounded-pill bg-danger d-flex align-items-center justify-content-center"
            style={{
              top: -4, right: -4, fontSize: '0.65rem', minWidth: 18, height: 18,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="card border-0 shadow-lg rounded-4"
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            width: 360,
            maxHeight: 480,
            overflowY: 'auto',
            zIndex: 1060,
          }}
        >
          <div className="d-flex align-items-center justify-between px-3 py-3 border-bottom">
            <h6 className="fw-bold mb-0">🔔 Notifications</h6>
            {unreadCount > 0 && (
              <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={handleMarkAll}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading && items.length === 0 ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center text-muted py-4">
                <div style={{ fontSize: '2rem' }}>🔕</div>
                <small>No notifications yet</small>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n._id}
                  className={`px-3 py-2 border-bottom d-flex gap-2 align-items-start ${!n.isRead ? 'bg-primary bg-opacity-10' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleItemClick(n)}
                >
                  <span style={{ fontSize: '1.2rem' }}>{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <small className={`fw-semibold ${!n.isRead ? 'text-primary' : ''}`}>
                        {n.title}
                      </small>
                      {!n.isRead && (
                        <span className="rounded-circle bg-primary" style={{ width: 8, height: 8 }} />
                      )}
                    </div>
                    <small className="text-muted d-block" style={{ lineHeight: 1.3 }}>
                      {n.message}
                    </small>
                    <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
