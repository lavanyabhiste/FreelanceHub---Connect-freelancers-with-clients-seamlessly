import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { chatService } from '../../services/chatService';
import { toast } from 'react-toastify';

export default function FreelancerChatListPage() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const res = await chatService.getMyChats();
        setChats(res.chats);
      } catch (err) {
        toast.error(err.message || 'Failed to load chats.');
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, []);

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <h2 className="fw-bold mb-4">💬 Messages</h2>

      {chats.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
          <div style={{ fontSize: '3rem' }}>💬</div>
          <h5 className="mt-3 fw-bold">No conversations yet</h5>
          <p className="text-muted">Once a client approves your proposal, you can start chatting here.</p>
        </div>
      ) : (
        <div className="row g-3">
          {chats.map((chat) => {
            const otherParty = user?.role === 'Freelancer' ? chat.client : chat.freelancer;
            const lastMsg = chat.lastMessage;
            return (
              <div key={chat._id} className="col-12">
                <div
                  className="card border-0 rounded-4 shadow-sm p-4"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/freelancer/chat/${chat.project?._id || chat.project}`)}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)' }}
                    >
                      {otherParty?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between">
                        <h6 className="fw-bold mb-0 text-truncate">{otherParty?.name}</h6>
                        {lastMsg && (
                          <small className="text-muted flex-shrink-0 ms-2">
                            {new Date(lastMsg.createdAt).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                      <small className="text-muted d-block text-truncate">
                        {lastMsg?.message || 'No messages yet'}
                      </small>
                      <small className="text-primary d-block text-truncate">
                        📁 {chat.project?.title}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
