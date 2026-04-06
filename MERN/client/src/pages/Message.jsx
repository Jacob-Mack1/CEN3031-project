import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Message() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);

  // Mock user data - replace with actual API call
  const mockUsers = [
    { id: 1, name: 'John Smith', email: 'john@example.com' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com' },
    { id: 3, name: 'Michael Brown', email: 'michael@example.com' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com' },
    { id: 5, name: 'David Wilson', email: 'david@example.com' },
  ];

  const filteredUsers = mockUsers.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageText.trim() && selectedUser) {
      setMessages([
        ...messages,
        {
          id: Date.now(),
          to: selectedUser.name,
          text: messageText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setMessageText('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <Link className="text-blue-600 hover:text-blue-800 font-medium" to="/Dashboard">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Search Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Find People</h2>

              {/* Search Input */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* User List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedUser?.id === user.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="font-medium">{user.name}</div>
                      <div className={`text-sm ${selectedUser?.id === user.id ? 'text-blue-100' : 'text-gray-600'}`}>
                        {user.email}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No users found</p>
                )}
              </div>
            </div>
          </div>

          {/* Message Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {selectedUser ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Messaging {selectedUser.name}
                  </h2>

                  {/* Messages Display */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 h-64 overflow-y-auto border border-gray-200">
                    {messages.length > 0 ? (
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div key={msg.id} className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start mb-2 gap-4">
                              <span className="font-medium text-gray-900">To: {msg.to}</span> <span></span>
                              <span className="text-xs text-gray-500 flex-shrink-0">{msg.timestamp}</span>
                            </div>
                            <p className="text-gray-700 break-words">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="mx-auto h-16 w-16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg font-medium">Select a person to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
