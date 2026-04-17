import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Search() {
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [comments, setComments] = useState([]);
  const [newCommentData, setNewCommentData] = useState({
    userName: '',
    email: '',
    commentText: ''
  });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyData, setReplyData] = useState({
    userName: '',
    email: '',
    replyText: ''
  });
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem("gatorlinkLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const regex = /^[A-Z]{3}\d{4}$/;
    if (!regex.test(classCode)) {
      setError('Invalid class code. Please enter 3 letters followed by 4 numbers (e.g., EEL4744).');
      setSearchResult(null);
      return;
    }
    setError('');
    setLoading(true);
    setSearched(true);
    setComments([]);

    try {
      const response = await fetch(`http://localhost:5050/courses/search/${classCode}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Course not found');
        setSearchResult(null);
        return;
      }

      setSearchResult(data);
      setComments(data.comments || []);
      setError('');
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      setSearchResult(null);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setCommentError('');

    if (!newCommentData.userName.trim()) {
      setCommentError('Your name is required');
      return;
    }

    if (!newCommentData.commentText.trim()) {
      setCommentError('Comment cannot be empty');
      return;
    }

    setCommentLoading(true);

    try {
      const response = await fetch(`http://localhost:5050/courses/${searchResult._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: newCommentData.userName.trim(),
          email: newCommentData.email.trim(),
          commentText: newCommentData.commentText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCommentError(data.error || 'Failed to post comment');
        return;
      }

      setComments(data.comments || []);
      setNewCommentData({ userName: '', email: '', commentText: '' });
    } catch (err) {
      setCommentError('An error occurred while posting the comment. Please try again.');
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    setCommentError('');

    if (!replyData.userName.trim()) {
      setCommentError('Your name is required');
      return;
    }

    if (!replyData.replyText.trim()) {
      setCommentError('Reply cannot be empty');
      return;
    }

    setCommentLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5050/courses/${searchResult._id}/comments/${commentId}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userName: replyData.userName.trim(),
            email: replyData.email.trim(),
            replyText: replyData.replyText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setCommentError(data.error || 'Failed to post reply');
        return;
      }

      setComments(data.comments || []);
      setReplyData({ userName: '', email: '', replyText: '' });
      setReplyingTo(null);
    } catch (err) {
      setCommentError('An error occurred while posting the reply. Please try again.');
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleChange = (e) => {
    setClassCode(e.target.value);
    if (error) setError('');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <Link to="/Dashboard" className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="bg-white rounded-lg shadow p-6" align="center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Courses</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Class Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="classCode"
                    value={classCode}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., EEL4744"
                    maxLength="7"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">Format: 3 letters followed by 4 numbers</p>
                {error && <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>}
              </div>
            </form>
          </div>
        </div>

        {/* Course Details */}
        {searched && searchResult && !error && (
          <div className="space-y-6">
            {/* Course Post */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{backgroundColor:'lightblue'}}>
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
                <h2 className="text-4xl font-bold mb-2">{searchResult.classCode}</h2>
                <p className="text-indigo-100">{searchResult.courseName}</p>
              </div>
              <div className="p-6 space-y-4" style={{backgroundColor:'orange'}}>
                {searchResult.description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{searchResult.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  {searchResult.instructor && (
                    <div>
                      <p className="text-sm text-gray-600">Instructor</p>
                      <p className="font-semibold text-gray-900">{searchResult.instructor}</p>
                    </div>
                  )}
                  {searchResult.credits && (
                    <div>
                      <p className="text-sm text-gray-600">Credits</p>
                      <p className="font-semibold text-gray-900">{searchResult.credits}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 pt-2">Posted {formatDate(searchResult.createdAt)}</p>
              </div>
            </div>

            {/* Discussion Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Discussion ({comments.length})
              </h2>

              {/* Comments List */}
              <div className="space-y-4 mb-6">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment._id} className="space-y-2" style={{backgroundColor:'lightgreen'}}>
                      {/* Parent Comment */}
                      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{comment.userName}</p>
                            {comment.email && <p className="text-xs text-gray-500">{comment.email}</p>}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 mb-3">{comment.commentText}</p>
                        {isLoggedIn && (
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
                          >
                            {replyingTo === comment._id ? 'Cancel Reply' : 'Reply'}
                          </button>
                        )}
                      </div>

                      {/* Reply Form */}
                      {isLoggedIn && replyingTo === comment._id && (
                        <div className="ml-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="space-y-3">
                            <div>
                              <input
                                type="text"
                                placeholder="Your name"
                                value={replyData.userName}
                                onChange={(e) => setReplyData({ ...replyData, userName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              />
                            </div>
                            <div>
                              <input
                                type="email"
                                placeholder="Email (optional)"
                                value={replyData.email}
                                onChange={(e) => setReplyData({ ...replyData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              />
                            </div>
                            <textarea
                              placeholder="Write your reply..."
                              value={replyData.replyText}
                              onChange={(e) => setReplyData({ ...replyData, replyText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              rows="2"
                            />
                            {commentError && <p className="text-xs text-red-600">{commentError}</p>}
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={commentLoading}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
                              >
                                {commentLoading ? 'Posting...' : 'Reply'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-6 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply._id} className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-gray-900">{reply.userName}</p>
                                  {reply.email && <p className="text-xs text-gray-500">{reply.email}</p>}
                                </div>
                                <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                              </div>
                              <p className="text-gray-700">{reply.replyText}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600 mb-2">No comments yet</p>
                    <p className="text-sm text-gray-500">Be the first to start the discussion!</p>
                  </div>
                )}
              </div>

              {/* New Comment Form */}
              {isLoggedIn ? (
                <div className="bg-white rounded-lg shadow p-6" style={{backgroundColor:'lightyellow'}}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Your Comment</h3>
                  <form onSubmit={handleCommentSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="newUserName" className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="newUserName"
                        value={newCommentData.userName}
                        onChange={(e) => setNewCommentData({ ...newCommentData, userName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        id="newEmail"
                        value={newCommentData.email}
                        onChange={(e) => setNewCommentData({ ...newCommentData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="newCommentText" className="block text-sm font-medium text-gray-700 mb-1">
                        Comment *
                      </label>
                      <textarea
                        id="newCommentText"
                        value={newCommentData.commentText}
                        onChange={(e) => setNewCommentData({ ...newCommentData, commentText: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Share your thoughts about this course..."
                        rows="4"
                      />
                    </div>
                    {commentError && (
                      <p className="text-sm text-red-600 font-medium">{commentError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={commentLoading}
                      className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {commentLoading ? 'Posting...' : 'Post Comment'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-700 mb-4">
                    <Link to="/Login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                      Log in
                    </Link>
                    {' '}to leave a comment
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
