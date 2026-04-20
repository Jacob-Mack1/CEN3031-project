import { useState, useEffect, useRef, useCallback } from 'react';

const API = 'http://localhost:5050';

// ─── Shared styles matching the reference screenshots ───────────────────────
const WIN_W = 300;
const WIN_H = 460;

const s = {
  window: {
    position: 'fixed',
    bottom: '20px',
    width: `${WIN_W}px`,
    height: `${WIN_H}px`,
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1000,
    fontFamily: '"DM Sans", sans-serif',
  },
  header: {
    backgroundColor: '#3758f9',
    color: '#ffffff',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '1px',
    flexShrink: 0,
    textTransform: 'uppercase',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '15px',
    padding: '0 3px',
    lineHeight: 1,
    opacity: 0.9,
  },
  searchRow: {
    display: 'flex',
    gap: '6px',
    padding: '8px',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  blueBtn: {
    backgroundColor: '#3758f9',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  contactCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: '6px',
    margin: '2px 6px',
  },
  avatar: {
    borderRadius: '50%',
    backgroundColor: '#3758f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: '700',
    flexShrink: 0,
    overflow: 'hidden',
  },
  msgBubble: {
    borderRadius: '6px',
    padding: '7px 10px',
    fontSize: '13px',
    lineHeight: 1.4,
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    fontSize: '10px',
    cursor: 'pointer',
    padding: '1px 4px',
    borderRadius: '3px',
    fontFamily: 'inherit',
  },
  inputRow: {
    display: 'flex',
    gap: '6px',
    padding: '8px',
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  toggleBtn: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: '#3758f9',
    color: '#ffffff',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(55,88,249,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    fontFamily: 'inherit',
  },
};

// ─── Small avatar circle ─────────────────────────────────────────────────────
function AvatarCircle({ src, name, size = 36 }) {
  return (
    <div
      style={{
        ...s.avatar,
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        (name || '?')[0].toUpperCase()
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function MessagingSystem({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { userId, username, avatar }
  const [messages, setMessages] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const isAnonymousUser = !!user?.anonymous;

  // Hidden contacts survive re-renders; keyed by userId → ISO timestamp of when hidden
  const hiddenRef = useRef({});
  const conversationCacheRef = useRef({});
  const messagesEndRef = useRef(null);
  const hiddenStorageKey = user?._id ? `hiddenDmContacts:${user._id}` : null;

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const persistHiddenContacts = useCallback((value) => {
    if (!hiddenStorageKey) return;
    localStorage.setItem(hiddenStorageKey, JSON.stringify(value));
  }, [hiddenStorageKey]);

  useEffect(() => {
    if (!hiddenStorageKey) return;
    try {
      const stored = localStorage.getItem(hiddenStorageKey);
      hiddenRef.current = stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load hidden DM contacts:', e);
      hiddenRef.current = {};
    }
  }, [hiddenStorageKey]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    if (!user?._id || isAnonymousUser) return;
    setContactsLoading(true);
    try {
      const res = await fetchWithTimeout(`${API}/messages/contacts/${user._id}`);
      if (!res.ok) {
        setSearchError('Unable to load conversations right now');
        return;
      }
      const data = await res.json();

      setContacts((prev) => {
        const prevMap = Object.fromEntries(prev.map((c) => [c.userId, c]));
        const result = [];

        for (const contact of data) {
          const hiddenAt = hiddenRef.current[contact.userId];
          if (hiddenAt) {
            // Un-hide only if the contact sent a newer message after being hidden.
            if (
              contact.lastSenderId === contact.userId &&
              contact.lastAt &&
              new Date(contact.lastAt) > new Date(hiddenAt)
            ) {
              delete hiddenRef.current[contact.userId];
              persistHiddenContacts(hiddenRef.current);
              result.push({ ...(prevMap[contact.userId] || {}), ...contact });
            }
            // else still hidden → skip
          } else {
            result.push({ ...(prevMap[contact.userId] || {}), ...contact });
          }
        }
        return result;
      });
    } catch (e) {
      console.error('fetchContacts error:', e);
      setSearchError('Unable to load conversations right now');
    } finally {
      setContactsLoading(false);
    }
  }, [user?._id, isAnonymousUser, persistHiddenContacts]);

  const fetchMessages = useCallback(
    async (otherId, opts = {}) => {
      if (!user?._id || isAnonymousUser) return;
      const { showLoading = true } = opts;
      if (showLoading) {
        setMessagesLoading(true);
      }
      try {
        const res = await fetchWithTimeout(
          `${API}/messages/conversation/${user._id}/${otherId}`
        );
        if (!res.ok) {
          setSearchError('Unable to load this conversation');
          return;
        }
        const data = await res.json();
        conversationCacheRef.current[otherId] = data;
        setMessages(data);
      } catch (e) {
        console.error('fetchMessages error:', e);
        setSearchError('Unable to load this conversation');
      } finally {
        setMessagesLoading(false);
      }
    },
    [user?._id, isAnonymousUser]
  );

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !user?._id || isAnonymousUser) return;
    fetchContacts();
    const id = setInterval(fetchContacts, 2500);
    return () => clearInterval(id);
  }, [isOpen, user?._id, isAnonymousUser, fetchContacts]);

  useEffect(() => {
    if (!activeChat || !user?._id || isAnonymousUser) return;
    const id = setInterval(
      () => fetchMessages(activeChat.userId, { showLoading: false }),
      2500
    );
    return () => clearInterval(id);
  }, [activeChat, user?._id, isAnonymousUser, fetchMessages]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddUser = async () => {
    if (isAnonymousUser) {
      setSearchError('Anonymous users cannot send or receive messages');
      return;
    }
    const username = searchInput.trim();
    if (!username) return;
    setSearchError('');

    try {
      const res = await fetch(
        `${API}/messages/find-user/${encodeURIComponent(username.toLowerCase())}`
      );
      if (!res.ok) {
        setSearchError('User not found');
        return;
      }
      const found = await res.json();

      if (found.userId === user._id) {
        setSearchError("That's you!");
        return;
      }

      // Un-hide if in hidden list
      delete hiddenRef.current[found.userId];
      persistHiddenContacts(hiddenRef.current);

      setContacts((prev) => {
        if (prev.find((c) => c.userId === found.userId)) return prev;
        return [
          ...prev,
          {
            userId: found.userId,
            username: found.username,
            avatar: found.avatar,
            lastMessage: null,
            lastAt: null,
          },
        ];
      });
      setSearchInput('');
    } catch {
      setSearchError('Could not reach server');
    }
  };

  const handleOpenChat = async (contact) => {
    if (isAnonymousUser) return;
    setActiveChat(contact);
    // Instant render from cache for snappier chat switching.
    const cached = conversationCacheRef.current[contact.userId] || [];
    setMessages(cached);
    await fetchMessages(contact.userId, { showLoading: cached.length === 0 });
  };

  const handleRemoveUser = (userId) => {
    hiddenRef.current[userId] = new Date().toISOString();
    persistHiddenContacts(hiddenRef.current);
    setContacts((prev) => prev.filter((c) => c.userId !== userId));
    if (activeChat?.userId === userId) {
      setActiveChat(null);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (isAnonymousUser) return;
    const text = messageInput.trim();
    if (!text || !activeChat) return;

    const displayName =
      user.anonymous ? 'Anonymous' : user.username;

    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user._id,
          senderUsername: displayName,
          senderAvatar: user.avatar || null,
          recipientId: activeChat.userId,
          recipientUsername: activeChat.username,
          recipientAvatar: activeChat.avatar || null,
          text,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSearchError(err.error || 'Could not send message');
        return;
      }
      const msg = await res.json();
      setMessages((prev) => {
        const updated = [...prev, msg];
        conversationCacheRef.current[activeChat.userId] = updated;
        return updated;
      });
      setMessageInput('');
      fetchContacts(); // refresh last-message preview
    } catch (e) {
      console.error('Send error:', e);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await fetch(`${API}/messages/${messageId}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const handleReportMessage = async (messageId) => {
    try {
      const res = await fetch(`${API}/messages/${messageId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Reported from direct messages',
          reportedBy: user?.username || 'Unknown',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSearchError(err.error || 'Failed to report message');
        return;
      }

      setSearchError('Message reported');
      setTimeout(() => setSearchError(''), 2000);
    } catch (e) {
      console.error('Report error:', e);
      setSearchError('Failed to report message');
    }
  };

  // ── Render guard ───────────────────────────────────────────────────────────
  if (!user) return null;

  if (!isOpen) {
    return (
      <button
        style={s.toggleBtn}
        onClick={() => setIsOpen(true)}
        title="Open messages"
      >
        💬
      </button>
    );
  }

  // How far the user-list window sits from the right edge
  const LIST_RIGHT = 20;
  // Chat window sits immediately to the left of user-list (+ 10px gap)
  const CHAT_RIGHT = LIST_RIGHT + WIN_W + 10;

  return (
    <>
      {isAnonymousUser ? (
        <div style={{ ...s.window, right: `${LIST_RIGHT}px` }}>
          <div style={s.header}>
            <span>Messages</span>
            <button
              style={s.iconBtn}
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#6b7280',
                fontSize: '14px',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              Anonymous accounts cannot send or receive direct messages.
            </p>
          </div>
        </div>
      ) : (
        <>
      {/* ── Chat Window (opens when a contact is selected) ── */}
      {activeChat && (
        <div style={{ ...s.window, right: `${CHAT_RIGHT}px` }}>
          {/* Header */}
          <div style={s.header}>
            <span>{activeChat.username}</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                style={{ ...s.iconBtn, fontSize: '11px' }}
                title="Remove user from contacts"
                onClick={() => handleRemoveUser(activeChat.userId)}
              >
                ✕ REMOVE
              </button>
              <button
                style={s.iconBtn}
                title="Close chat"
                onClick={() => { setActiveChat(null); setMessages([]); }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Message list */}
          <div style={s.scrollArea}>
            {messagesLoading && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '24px' }}>
                Loading messages...
              </p>
            )}
            {!messagesLoading && messages.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '24px' }}>
                No messages yet. Say hi!
              </p>
            )}
            {messages.map((msg) => {
              const isMine = msg.senderId === user._id;
              const displayName = isMine
                ? (user.anonymous ? 'Anonymous' : user.username)
                : activeChat.username;
              const avatarSrc = isMine ? user.avatar : activeChat.avatar;

              return (
                <div
                  key={msg._id}
                  style={{
                    display: 'flex',
                    flexDirection: isMine ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '6px',
                    margin: '6px 8px',
                  }}
                >
                  <AvatarCircle src={avatarSrc} name={displayName} size={28} />
                  <div style={{ maxWidth: '68%' }}>
                    {/* Sender name */}
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginBottom: '2px',
                      textAlign: isMine ? 'right' : 'left',
                    }}>
                      {displayName}
                    </div>
                    {/* Bubble */}
                    <div style={{
                      ...s.msgBubble,
                      backgroundColor: isMine ? '#eff3ff' : '#f3f4f6',
                      color: '#111827',
                    }}>
                      {msg.text}
                    </div>
                    {/* Action row */}
                    <div style={{ textAlign: isMine ? 'right' : 'left', marginTop: '2px' }}>
                      {isMine ? (
                        <button
                          style={{ ...s.actionBtn, color: '#ef4444' }}
                          onClick={() => handleDeleteMessage(msg._id)}
                        >
                          delete
                        </button>
                      ) : (
                        <button
                          style={{ ...s.actionBtn, color: '#9ca3af' }}
                          onClick={() => handleReportMessage(msg._id)}
                        >
                          report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input row */}
          <div style={s.inputRow}>
            <input
              style={s.input}
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button style={s.blueBtn} onClick={handleSend}>SEND</button>
          </div>
        </div>
      )}

      {/* ── User List Window ── */}
      <div style={{ ...s.window, right: `${LIST_RIGHT}px` }}>
        {/* Header */}
        <div style={s.header}>
          <span>Messages</span>
          <button
            style={s.iconBtn}
            onClick={() => { setIsOpen(false); setActiveChat(null); }}
          >
            ✕
          </button>
        </div>

        {/* Search / Add bar */}
        <div style={s.searchRow}>
          <input
            style={s.input}
            placeholder="Search username..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setSearchError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
          />
          <button style={s.blueBtn} onClick={handleAddUser}>ADD</button>
        </div>
        {searchError && (
          <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 10px 4px', flexShrink: 0 }}>
            {searchError}
          </p>
        )}

        {/* Contact list */}
        <div style={s.scrollArea}>
          {contactsLoading && contacts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '28px', padding: '0 16px' }}>
              Loading conversations...
            </p>
          ) : contacts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '28px', padding: '0 16px' }}>
              No conversations yet.<br />Search a username above to start chatting!
            </p>
          ) : (
            contacts.map((contact) => {
              const isActive = activeChat?.userId === contact.userId;
              return (
                <div
                  key={contact.userId}
                  onClick={() => handleOpenChat(contact)}
                  style={{
                    ...s.contactCard,
                    backgroundColor: isActive ? '#eff3ff' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <AvatarCircle src={contact.avatar} name={contact.username} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#111827',
                    }}>
                      {contact.username}
                    </div>
                    {contact.lastMessage && (
                      <div style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {contact.lastMessage}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      )}
    </>
  );
}
