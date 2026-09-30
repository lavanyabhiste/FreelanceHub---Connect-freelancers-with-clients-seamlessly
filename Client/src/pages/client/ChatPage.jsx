import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { chatService } from '../../services/chatService';
import { uploadService } from '../../services/notificationService';
import { getSocket, connectSocket } from '../../services/socket';
import { fetchUnreadCount } from '../../slices/notificationSlice';
import { toast } from 'react-toastify';
import { ArrowBack, Send, AttachFile, Check, CheckCircle, Close } from '@mui/icons-material';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar';

export default function ChatPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  const otherUserId = chat
    ? chat.client?._id !== user?._id
      ? chat.client?._id
      : chat.freelancer?._id
    : null;

  // Load chat + history
  const loadChat = useCallback(async () => {
    try {
      const chatRes = await chatService.getOrCreateProjectChat(projectId);
      setChat(chatRes.chat);
      const msgRes = await chatService.getChatMessages(chatRes.chat._id);
      setMessages(msgRes.messages);

      // Mark incoming messages as read
      await chatService.markMessagesRead(chatRes.chat._id);
      dispatch(fetchUnreadCount());
    } catch (err) {
      toast.error(err.message || 'Failed to load chat.');
    } finally {
      setLoading(false);
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Socket.IO: join room, listen for real-time messages
  useEffect(() => {
    if (!chat) return;
    const socket = getSocket() || connectSocket();
    if (!socket) return;
    socketRef.current = socket;

    socket.emit('join_chat', chat._id);

    const onNewMessage = ({ chatId, message }) => {
      if (chatId !== chat._id) return;
      setMessages((prev) => {
        // Avoid duplicates (optimistic sends)
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      // Mark incoming as read since we're viewing this chat
      if (message.sender?._id !== user?._id) {
        chatService.markMessagesRead(chat._id).then(() => dispatch(fetchUnreadCount())).catch(() => {});
      }
    };

    const onMessagesRead = ({ chatId, readBy }) => {
      if (chatId === chat._id && readBy !== user?._id) {
        setMessages((prev) => prev.map((m) => (m.sender?._id === user?._id ? { ...m, read: true } : m)));
      }
    };

    const onTyping = ({ chatId, userId }) => {
      if (chatId === chat._id && userId !== user?._id) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2500);
      }
    };

    socket.on('new_message', onNewMessage);
    socket.on('messages_read', onMessagesRead);
    socket.on('typing', onTyping);

    return () => {
      socket.emit('leave_chat', chat._id);
      socket.off('new_message', onNewMessage);
      socket.off('messages_read', onMessagesRead);
      socket.off('typing', onTyping);
    };
  }, [chat, user?._id, dispatch]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Typing indicator (throttled via ref)
  const lastTypingEmit = useRef(0);
  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypingEmit.current > 1500 && socketRef.current && chat) {
      socketRef.current.emit('typing', { chatId: chat._id, userId: user?._id });
      lastTypingEmit.current = now;
    }
  };

  // File attachment handler
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: file size cannot exceed 10MB.`);
        continue;
      }
      setUploading(true);
      try {
        const res = await uploadService.uploadChatFile(file);
        setAttachments((prev) => [...prev, res.attachment]);
        toast.success(`📎 ${file.name} attached`);
      } catch (err) {
        toast.error(err.message || `Failed to upload ${file.name}.`);
      } finally {
        setUploading(false);
      }
    }
    e.target.value = '';
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !chat) return;
    setSending(true);
    try {
      const res = await chatService.sendMessage(chat._id, newMessage.trim(), attachments);
      setMessages((prev) => (prev.some((m) => m._id === res.message._id) ? prev : [...prev, res.message]));
      setNewMessage('');
      setAttachments([]);
      // Confirm own message as delivered
      socketRef.current?.emit('mark_read', { chatId: chat._id, userId: otherUserId });
    } catch (err) {
      toast.error(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  if (!chat) {
    return (
      <div className="container py-5 text-center">
        <h4>Chat not available.</h4>
        <p className="text-muted">A freelancer must be approved before you can chat.</p>
        <button className="btn btn-primary rounded-3 mt-3" onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  const otherParty = user?.role === 'Client' ? chat.freelancer : chat.client;

  const renderAttachment = (att, mine) => {
    const isImage = att.fileType?.startsWith('image/');
    if (isImage) {
      return (
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="d-block">
          <img
            src={att.url}
            alt={att.filename}
            className="rounded-3 mb-1"
            style={{ maxWidth: 240, maxHeight: 180, objectFit: 'cover' }}
          />
        </a>
      );
    }
    return (
      <a
        href={att.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`d-flex align-items-center gap-2 rounded-3 px-2 py-1 text-decoration-none ${mine ? 'bg-white bg-opacity-25' : 'bg-light border'}`}
        style={{ maxWidth: 260 }}
      >
        <span>📎</span>
        <span className={`small text-truncate ${mine ? 'text-white' : 'text-dark'}`}>{att.filename}</span>
      </a>
    );
  };

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-outline-secondary btn-sm rounded-3" onClick={() => navigate(-1)}>
          <ArrowBack fontSize="small" />
        </button>
        <div
          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
          style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)' }}
        >
          {otherParty?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h5 className="fw-bold mb-0">{otherParty?.name}</h5>
          <small className="text-muted">Re: {chat.project?.title}</small>
        </div>
        <span className="ms-auto badge bg-light text-secondary border rounded-pill small">
          {chat.project?.status}
        </span>
      </div>

      {/* Messages */}
      <div
        className="card border-0 rounded-4 shadow-sm mb-3"
        style={{ height: '60vh', overflowY: 'auto', padding: '1.5rem', background: '#f8fafc' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-muted py-5">
            <div style={{ fontSize: '2.5rem' }}>💬</div>
            <p className="mb-0">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
            return (
              <div
                key={msg._id}
                className={`d-flex mb-3 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  className={`rounded-4 px-3 py-2 ${isMine ? 'bg-primary text-white' : 'bg-white border'}`}
                  style={{ maxWidth: '75%' }}
                >
                  {/* Attachments */}
                  {msg.attachments?.length > 0 && (
                    <div className="d-flex flex-column gap-1 mb-1">
                      {msg.attachments.map((att, i) => (
                        <div key={i}>{renderAttachment(att, isMine)}</div>
                      ))}
                    </div>
                  )}

                  {/* Text */}
                  {msg.message && (
                    <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                  )}

                  {/* Timestamp + read receipt */}
                  <div className={`d-flex align-items-center gap-1 ${isMine ? 'justify-content-end' : ''}`}>
                    <small className={isMine ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.7rem' }}>
                      {new Date(msg.createdAt).toLocaleString([], {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </small>
                    {isMine && (
                      msg.read
                        ? <CheckCircle style={{ fontSize: 14, color: '#7dd3fc' }} />
                        : <Check style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typing && (
          <div className="text-muted small ms-1">
            <em>{otherParty?.name} is typing…</em>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending attachments preview */}
      {attachments.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-2 p-2 bg-white border rounded-3">
          {attachments.map((att, i) => (
            <span key={i} className="badge bg-primary-subtle text-primary d-flex align-items-center gap-1 px-2 py-1">
              📎 {att.filename}
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-danger"
                style={{ lineHeight: 1 }}
                onClick={() => removeAttachment(i)}
              >
                <Close style={{ fontSize: 14 }} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="d-flex gap-2 align-items-center">
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept={ACCEPTED}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="btn btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center"
          style={{ width: 44, height: 44 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach files (max 10MB each)"
        >
          {uploading
            ? <span className="spinner-border spinner-border-sm" />
            : <AttachFile fontSize="small" />}
        </button>
        <input
          className="form-control rounded-3"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
          maxLength={4000}
        />
        <button
          type="submit"
          className="btn btn-primary rounded-3 px-4 d-flex align-items-center"
          disabled={sending || uploading || (!newMessage.trim() && attachments.length === 0)}
        >
          <Send fontSize="small" />
        </button>
      </form>
    </div>
  );
}
