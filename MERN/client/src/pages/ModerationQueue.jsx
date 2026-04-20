import { useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:5050';

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sourceLabel(item) {
  if (item.source === 'dm') {
    return 'Direct Message';
  }
  if (item.source === 'forum-comment') {
    return 'Forum Comment';
  }
  return 'Forum Reply';
}

export default function ModerationQueue({ user, isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState({});

  const visible = !!isOpen && !!user?.isModerator;

  const queueEndpoint = useMemo(() => {
    if (!user?._id) {
      return null;
    }
    return `${API}/moderation/queue/${user._id}`;
  }, [user?._id]);

  const fetchQueue = async () => {
    if (!queueEndpoint) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(queueEndpoint);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load moderation queue');
        return;
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load moderation queue');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      return;
    }
    fetchQueue();
  }, [visible]);

  const runAction = async (action, item) => {
    const id = `${action}-${item.source}-${item.messageId || item.replyId || item.commentId}`;
    setActionBusy((prev) => ({ ...prev, [id]: true }));

    try {
      const response = await fetch(`${API}/moderation/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderatorUserId: user._id,
          source: item.source,
          courseId: item.courseId,
          commentId: item.commentId,
          replyId: item.replyId,
          messageId: item.messageId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || `Failed to ${action} item`);
        return;
      }

      setItems((prev) =>
        prev.filter((entry) => {
          if (item.source === 'dm') {
            return entry.messageId !== item.messageId;
          }

          if (item.source === 'forum-reply') {
            return !(entry.source === 'forum-reply' && entry.replyId === item.replyId);
          }

          return !(entry.source === 'forum-comment' && entry.commentId === item.commentId);
        })
      );
    } catch (err) {
      setError(`Failed to ${action} item`);
      console.error(err);
    } finally {
      setActionBusy((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(255,255,255,0.95)',
        zIndex: 1200,
        overflowY: 'auto',
        padding: '24px',
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="blocky-card bg-white p-4 mb-4 flex items-center justify-between">
          <div>
            <h2
              className="text-2xl font-bold text-gray-900"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 0 }}
            >
              Moderation Queue
            </h2>
            <p className="text-sm text-gray-600 mb-0">Review reported forum posts and direct messages.</p>
          </div>
          <button className="blocky-button blocky-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {error && (
          <div className="blocky-card p-3 mb-4" style={{ borderColor: '#ef4444', backgroundColor: '#fef2f2' }}>
            <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="blocky-card bg-white p-8 text-center">
            <p className="text-gray-600 mb-0">Loading reported content...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="blocky-card bg-white p-8 text-center">
            <p className="text-gray-700 mb-1">Queue is clear.</p>
            <p className="text-sm text-gray-500 mb-0">No flagged content requires review right now.</p>
          </div>
        ) : (
          <div className="discussion-thread space-y-0">
            {items.map((item) => {
              const deleteKey = `delete-${item.source}-${item.messageId || item.replyId || item.commentId}`;
              const unflagKey = `unflag-${item.source}-${item.messageId || item.replyId || item.commentId}`;

              return (
                <div key={`${item.source}-${item.messageId || item.replyId || item.commentId}`} className="comment-block">
                  <div className="blocky-card bg-white p-4 border-l-4 border-indigo-500 comment-card">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">{item.authorName || 'Unknown user'}</p>
                        <p className="text-xs text-gray-600 mb-0">
                          {sourceLabel(item)}
                          {item.courseClassCode ? ` - ${item.courseClassCode}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">Flagged {formatDate(item.flaggedAt)}</span>
                    </div>

                    <p className="text-gray-800 mb-3" style={{ fontFamily: 'Trebuchet MS' }}>
                      {item.text}
                    </p>

                    <div className="blocky-card p-3 mb-3" style={{ borderStyle: 'dashed', borderColor: '#d1d5db' }}>
                      <p className="text-xs text-gray-700 mb-1" style={{ marginBottom: '4px' }}>
                        <strong>Reported by:</strong> {item.reportedBy || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-700 mb-0">
                        <strong>Reason:</strong> {item.reportReason || 'No reason provided'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        className="blocky-button blocky-button-secondary"
                        style={{ minWidth: '120px' }}
                        onClick={() => runAction('unflag', item)}
                        disabled={!!actionBusy[unflagKey]}
                      >
                        {actionBusy[unflagKey] ? 'Working...' : 'Unflag'}
                      </button>
                      <button
                        className="blocky-button"
                        style={{ minWidth: '120px', backgroundColor: '#ef4444', color: '#fff', borderColor: '#b91c1c' }}
                        onClick={() => runAction('delete', item)}
                        disabled={!!actionBusy[deleteKey]}
                      >
                        {actionBusy[deleteKey] ? 'Working...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
