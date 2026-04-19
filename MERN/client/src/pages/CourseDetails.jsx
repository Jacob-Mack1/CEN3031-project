import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [followedCourses, setFollowedCourses] = useState([]);
  const [newCommentData, setNewCommentData] = useState({
    commentText: ''
  });
  const [replyingTo, setReplyingTo] = useState({});
  const [replyData, setReplyData] = useState({});
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [reportingData, setReportingData] = useState(null); // { type: 'comment'|'reply', commentId, replyId }
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem("gatorlinkLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
    
    let loadedUser = null;
    
    // Get current user from localStorage
    if (loggedIn) {
      const userData = localStorage.getItem("currentUser");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          // Check if user is anonymous
          if (user.anonymous) {
            loadedUser = { ...user, displayName: 'Anonymous User' };
          } else {
            loadedUser = user;
          }
          setCurrentUser(loadedUser);
          
          // Load followed courses from user data
          if (user.followedCourses && Array.isArray(user.followedCourses)) {
            setFollowedCourses(user.followedCourses);
          }
        } catch (err) {
          console.error('Error parsing current user:', err);
          setCurrentUser(null);
          setFollowedCourses([]);
        }
      }
    } else {
      setCurrentUser(null);
      setFollowedCourses([]);
    }

    // Fetch course details
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5050/courses/${courseId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Course not found');
          setCourseData(null);
          return;
        }

        setCourseData(data);
        setComments(data.comments || []);
        setError('');
      } catch (err) {
        setError('An error occurred while loading the course. Please try again.');
        setCourseData(null);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setCommentError('');

    if (!newCommentData.commentText.trim()) {
      setCommentError('Comment cannot be empty');
      return;
    }

    if (!currentUser) {
      setCommentError('User information not found. Please log in again.');
      return;
    }

    setCommentLoading(true);

    try {
      const response = await fetch(`http://localhost:5050/courses/${courseId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: currentUser.displayName || currentUser.username,
          email: currentUser.email || '',
          avatar: currentUser.avatar || '',
          commentText: newCommentData.commentText.trim(),
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('Failed to parse comment response:', parseErr);
        setCommentError('Server error: Invalid response format');
        setCommentLoading(false);
        return;
      }

      console.log('Comment response:', { status: response.status, data });

      if (!response.ok) {
        const errorMsg = data?.error || 'Failed to post comment';
        console.error('Comment failed:', errorMsg);
        setCommentError(errorMsg);
        setCommentLoading(false);
        return;
      }

      // Update comments from the response
      if (data && Array.isArray(data.comments)) {
        console.log('Updating comments with:', data.comments.length, 'comments');
        setComments(data.comments);
        setNewCommentData({ commentText: '' });
        setCommentLoading(false);
      } else {
        console.error('Unexpected response structure:', data);
        setCommentError('Failed to update comments - invalid response structure');
        setCommentLoading(false);
      }
    } catch (err) {
      console.error('Comment submission error:', err);
      setCommentError('An error occurred while posting the comment. Please try again.');
      setCommentLoading(false);
    }
  };

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    setCommentError('');

    const replyKey = `reply-${commentId}`;
    if (!replyData[replyKey] || !replyData[replyKey].trim()) {
      setCommentError('Reply cannot be empty');
      return;
    }

    if (!currentUser) {
      setCommentError('User information not found. Please log in again.');
      return;
    }

    setCommentLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5050/courses/${courseId}/comments/${commentId}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userName: currentUser.displayName || currentUser.username,
            email: currentUser.email || '',
            avatar: currentUser.avatar || '',
            replyText: replyData[replyKey].trim(),
          }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('Failed to parse reply response:', parseErr);
        setCommentError('Server error: Invalid response format');
        setCommentLoading(false);
        return;
      }

      console.log('Reply response:', { status: response.status, data });

      if (!response.ok) {
        const errorMsg = data?.error || 'Failed to post reply';
        console.error('Reply failed:', errorMsg);
        setCommentError(errorMsg);
        setCommentLoading(false);
        return;
      }

      // Update comments from the response
      if (data && Array.isArray(data.comments)) {
        console.log('Updating comments with:', data.comments.length, 'comments');
        setComments(data.comments);
        // Clear only this reply's text
        setReplyData({ ...replyData, [replyKey]: '' });
        setReplyingTo({ ...replyingTo, [replyKey]: false });
        setCommentLoading(false);
      } else {
        console.error('Unexpected response structure:', data);
        setCommentError('Failed to update comments - invalid response structure');
        setCommentLoading(false);
      }
    } catch (err) {
      console.error('Reply submission error:', err);
      setCommentError('An error occurred while posting the reply. Please try again.');
      setCommentLoading(false);
    }
  };

  const handleNestedReplySubmit = async (e, commentId, replyId) => {
    e.preventDefault();
    setCommentError('');

    const replyKey = `${commentId}-${replyId}`;
    if (!replyData[replyKey] || !replyData[replyKey].trim()) {
      setCommentError('Nested reply cannot be empty');
      return;
    }

    if (!currentUser) {
      setCommentError('User information not found. Please log in again.');
      return;
    }

    setCommentLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5050/courses/${courseId}/comments/${commentId}/replies/${replyId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userName: currentUser.displayName || currentUser.username,
            email: currentUser.email || '',
            avatar: currentUser.avatar || '',
            replyText: replyData[replyKey].trim(),
          }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('Failed to parse nested reply response:', parseErr);
        setCommentError('Server error: Invalid response format');
        setCommentLoading(false);
        return;
      }

      console.log('Nested reply response:', { status: response.status, data });

      if (!response.ok) {
        const errorMsg = data?.error || 'Failed to post nested reply';
        console.error('Nested reply failed:', errorMsg);
        setCommentError(errorMsg);
        setCommentLoading(false);
        return;
      }

      // Update comments from the response
      if (data && Array.isArray(data.comments)) {
        console.log('Updating comments with:', data.comments.length, 'comments');
        setComments(data.comments);
        // Clear only this reply's text
        setReplyData({ ...replyData, [replyKey]: '' });
        setReplyingTo({ ...replyingTo, [replyKey]: false });
        setCommentLoading(false);
      } else {
        console.error('Unexpected response structure:', data);
        setCommentError('Failed to update comments - invalid response structure');
        setCommentLoading(false);
      }
    } catch (err) {
      console.error('Nested reply submission error:', err);
      setCommentError('An error occurred while posting the reply. Please try again.');
      setCommentLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportingData) {
      setCommentError('Error: No item selected for reporting');
      return;
    }

    setCommentLoading(true);

    try {
      let url = `http://localhost:5050/courses/${courseId}/comments/${reportingData.commentId}`;
      
      if (reportingData.type === 'reply') {
        url += `/replies/${reportingData.replyId}`;
      }
      
      url += '/report';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reportReason.trim(),
          reportedBy: currentUser?.displayName || currentUser?.username || 'Anonymous User',
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('Failed to parse report response:', parseErr);
        setCommentError('Server error: Invalid response. Please try again.');
        setCommentLoading(false);
        return;
      }

      if (!response.ok) {
        const errorMsg = data?.error || 'Failed to submit report';
        setCommentError(errorMsg);
        setCommentLoading(false);
        return;
      }

      // Success - close modal and show confirmation
      setCommentError('');
      setReportingData(null);
      setReportReason('');
      setCommentError(`${reportingData.type === 'reply' ? 'Reply' : 'Comment'} reported successfully. Thank you for helping keep our community safe!`);
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setCommentError('');
      }, 3000);
      
      setCommentLoading(false);
    } catch (err) {
      console.error('Report submission error:', err);
      setCommentError('An error occurred while submitting the report. Please try again.');
      setCommentLoading(false);
    }
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

  const handleFollowCourse = async () => {
    if (!courseData || !currentUser) return;
    
    try {
      const response = await fetch(`http://localhost:5050/record/${currentUser._id}/follow-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: courseData._id,
          courseData: courseData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to toggle follow status:', data.error);
        return;
      }

      // Update currentUser with new followedCourses from backend
      const updatedUser = data.user;
      setCurrentUser(updatedUser);
      setFollowedCourses(updatedUser.followedCourses || []);
      
      // Also update localStorage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error toggling follow status:', err);
    }
  };

  const isCourseFol = courseData && followedCourses.some(
    (course) => course._id === courseData._id || course.classCode === courseData.classCode
  );

  const renderNestedReplies = (replies, commentId, parentReplyId, depth = 0) => {
    if (!replies || replies.length === 0) return null;

    return (
      <div className="replies-container" style={{ marginLeft: `${depth * 2}rem` }}>
        {replies.map((reply) => {
          const replyKey = `${commentId}-${reply._id}`;
          const isReplyingTo = replyingTo[replyKey];
          
          return (
            <div key={reply._id} className="reply-block">
              <div className="blocky-card bg-white p-4 border-l-4 border-gray-300 reply-card">
                {/* Reply Header with Avatar */}
                <div className="flex gap-3 mb-3">
                  {/* Avatar Container */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center relative">
                    {reply.avatar && reply.avatar.trim() && !reply.avatar.includes("undefined") ? (
                      <img 
                        src={reply.avatar} 
                        alt={reply.userName}
                        style={{ 
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          display: 'block'
                        }}
                        loading="lazy"
                        onError={(e) => {
                          // Hide broken image and show fallback
                          const parent = e.target.parentElement;
                          if (parent) {
                            e.target.style.display = 'none';
                            const fallback = parent.querySelector('[data-fallback="true"]');
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    {/* Fallback Avatar - Always in DOM */}
                    <div 
                      data-fallback="true"
                      style={{
                        display: (reply.avatar && reply.avatar.trim() && !reply.avatar.includes("undefined")) ? 'none' : 'flex',
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#4f46e5',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                    >
                      {reply.userName.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Username and Metadata */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-semibold text-gray-900">{reply.userName}</p>
                        <button
                          onClick={() => setReportingData({ type: 'reply', commentId, replyId: reply._id })}
                          className="text-xs text-gray-600 hover:text-red-700 font-medium transition mt-1 px-2 py-1 rounded border border-gray-300 hover:border-red-500 bg-white"
                          style={{cursor:'pointer'}}
                        >
                          Report
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Reply Text */}
                <p className="text-gray-700" style={{fontFamily:'Trebuchet MS'}}>{reply.replyText}</p>
                
                {/* Reply Button */}
                {isLoggedIn && (
                  <button
                    onClick={() => setReplyingTo({ ...replyingTo, [replyKey]: !isReplyingTo })}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
                    style={{border:'none', paddingLeft: '0px', paddingRight: '0px', paddingBottom: '3px', paddingTop: '3px' ,marginTop: '0.5rem'}}
                  >
                    {isReplyingTo ? '✕ Cancel Reply' : '↳ Reply'}
                  </button>
                )}
              </div>

              {/* Nested Reply Form */}
              {isLoggedIn && isReplyingTo && currentUser && (
                <div className="reply-form-container" style={{ marginLeft: `${depth * 2}rem` }}>
                  <div className="blocky-card bg-white rounded-lg p-4 reply-form">
                    <form onSubmit={(e) => handleNestedReplySubmit(e, commentId, reply._id)} className="space-y-3">
                      <p className="text-xs font-medium text-gray-600" style={{textTransform: 'uppercase', fontWeight: '700'}}>Replying as: <span className="text-indigo-600 font-bold">{currentUser.displayName || currentUser.username}</span></p>
                      <textarea
                        placeholder="Write your reply..."
                        value={replyData[replyKey] || ''}
                        onChange={(e) => setReplyData({ ...replyData, [replyKey]: e.target.value })}
                        className="slot-textarea w-full"
                        rows="2"
                      />
                      {commentError && <p className="text-xs text-red-600">{commentError}</p>}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={commentLoading}
                          className="px-4 py-2 blocky-button blocky-button-primary text-sm"
                        >
                          {commentLoading ? 'Posting...' : 'Reply'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Recursively render nested replies */}
              {reply.replies && reply.replies.length > 0 && renderNestedReplies(reply.replies, commentId, reply._id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)' }} className="p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)' }} className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="blocky-card bg-white p-6 text-center">
            <p className="text-red-600 font-medium">{error || 'Course not found'}</p>
          </div>
          <div className="mt-8">
            <Link to="/Dashboard">
              <button className="w-full blocky-button blocky-button-secondary">
                ← BACK TO DASHBOARD
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)' }} className="p-4">
      <div className="max-w-4xl mx-auto">
        {/* Course Post */}
        <div className="mb-8">
          <div className="blocky-card bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
              <h2 className="text-4xl font-bold mb-2" style={{fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '-1rem'}}>{courseData.classCode}</h2>
              <p className="text-indigo-100" style={{fontFamily: 'Verdana', marginTop: '0.5rem', marginBottom: '-1rem'}}>{courseData.courseName}</p>
            </div>
            <div className="p-6 space-y-4 bg-white">
              {courseData.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2" style={{marginBottom: '-0.5rem', textTransform: 'uppercase', fontWeight: '700'}}>Description</h3>
                  <p className="text-gray-700 leading-relaxed" style={{marginTop:'0.5rem', marginBottom: '-1rem'}}>{courseData.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {courseData.instructor && (
                  <div>
                    <p className="text-sm text-gray-600" style={{fontWeight:'bold', marginBottom: '0rem', textTransform: 'uppercase'}}>Instructor</p>
                    <p className="font-semibold text-gray-900" style={{marginTop:'-0.5rem', marginBottom: '-1rem'}}>{courseData.instructor}</p>
                  </div>
                )}
                {courseData.credits && (
                  <div>
                    <p className="text-sm text-gray-600" style={{fontWeight: 'bold', marginBottom: '-1rem', textTransform: 'uppercase'}}>Credits: {courseData.credits}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 pt-2">Posted {formatDate(courseData.createdAt)}</p>
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleFollowCourse}
                  className={`blocky-button ${isCourseFol ? 'blocky-button-success' : 'blocky-button-primary'}`}
                >
                  {isCourseFol ? '✓ FOLLOWING' : '+ FOLLOW'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pt-4" style={{marginTop: "1rem", marginBottom:"1.5rem", textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em'}}>
              Discussion ({comments.length})
            </h2>

            {/* New Comment Form - Positioned at top */}
            {currentUser ? (
              <div className="blocky-card bg-white p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em'}}>Add Your Comment</h3>
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2" style={{textTransform: 'uppercase', fontWeight: '700'}}>Posting as: <span className="text-indigo-600 font-bold">{currentUser.displayName || currentUser.username}</span></p>
                  </div>
                  <div>
                    <textarea
                      id="newCommentText"
                      value={newCommentData.commentText}
                      onChange={(e) => setNewCommentData({ ...newCommentData, commentText: e.target.value })}
                      className="slot-textarea w-full"
                      placeholder="Share your thoughts about this course..."
                      rows="3"
                    />
                  </div>
                  {commentError && (
                    <p className="text-sm text-red-600 font-medium">{commentError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={commentLoading}
                    className="w-full blocky-button blocky-button-primary"
                  >
                    {commentLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="blocky-card bg-white p-6 mb-8 text-center">
                <p className="text-gray-700 mb-4">
                  <Link to="/Login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                    Log in
                  </Link>
                  {' '}to leave a comment
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="discussion-thread space-y-0">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="comment-block">
                    {/* Parent Comment */}
                    <div className="blocky-card bg-white p-4 border-l-4 border-indigo-500 comment-card">
                      {/* Comment Header with Avatar */}
                      <div className="flex gap-3 mb-3">
                        {/* Avatar Container */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center relative">
                          {comment.avatar && comment.avatar.trim() && !comment.avatar.includes("undefined") ? (
                            <img 
                              src={comment.avatar} 
                              alt={comment.userName}
                              style={{ 
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                display: 'block'
                              }}
                              loading="lazy"
                              onError={(e) => {
                                // Hide broken image and show fallback
                                const parent = e.target.parentElement;
                                if (parent) {
                                  e.target.style.display = 'none';
                                  const fallback = parent.querySelector('[data-fallback="true"]');
                                  if (fallback) fallback.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          {/* Fallback Avatar - Always in DOM */}
                          <div 
                            data-fallback="true"
                            style={{
                              display: (comment.avatar && comment.avatar.trim() && !comment.avatar.includes("undefined")) ? 'none' : 'flex',
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#4f46e5',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}
                          >
                            {comment.userName.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        {/* Username and Metadata */}
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <p className="font-semibold text-gray-900">{comment.userName}</p>
                              <button
                                  onClick={() => setReportingData({ type: 'comment', commentId: comment._id })}
                                  className="text-xs text-gray-600 hover:text-red-700 font-medium transition mt-1 px-2 py-1 rounded border border-gray-300 hover:border-red-500 bg-white"
                                  style={{cursor:'pointer'}}
                              >
                                Report
                              </button>
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Comment Text */}
                      <p className="text-gray-700 mb-3" style={{fontFamily:'Trebuchet MS'}}>{comment.commentText}</p>
                      
                      {/* Reply Button */}
                      {isLoggedIn && (
                        <button
                          onClick={() => setReplyingTo({ ...replyingTo, [comment._id]: !replyingTo[comment._id] })}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
                          style={{border:'none', paddingLeft: '0px', paddingRight: '0px', paddingBottom: '3px', paddingTop: '3px' ,marginTop: '0.5rem'}}
                        >
                          {replyingTo[comment._id] ? '✕ Cancel Reply' : '↳ Reply'}
                        </button>
                      )}
                    </div>

                    {/* Reply Form */}
                    {isLoggedIn && replyingTo[comment._id] && currentUser && (
                      <div className="reply-form-container">
                        <div className="blocky-card bg-white rounded-lg p-4 reply-form">
                          <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="space-y-3">
                            <p className="text-xs font-medium text-gray-600" style={{textTransform: 'uppercase', fontWeight: '700'}}>Replying as: <span className="text-indigo-600 font-bold">{currentUser.displayName || currentUser.username}</span></p>
                            <textarea
                              placeholder="Write your reply..."
                              value={replyData[`reply-${comment._id}`] || ''}
                              onChange={(e) => setReplyData({ ...replyData, [`reply-${comment._id}`]: e.target.value })}
                              className="slot-textarea w-full"
                              rows="2"
                            />
                            {commentError && <p className="text-xs text-red-600">{commentError}</p>}
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={commentLoading}
                                className="px-4 py-2 blocky-button blocky-button-primary text-sm"
                              >
                                {commentLoading ? 'Posting...' : 'Reply'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && renderNestedReplies(comment.replies, comment._id, null, 0)}
                  </div>
                ))
              ) : (
                <div className="blocky-card bg-white p-8 text-center">
                  <p className="text-gray-600 mb-2">No comments yet</p>
                  <p className="text-sm text-gray-500">Be the first to start the discussion!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Modal */}
        {reportingData && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}>
            <div className="blocky-card bg-white p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={{textTransform: 'uppercase', fontWeight: '900'}}>Report {reportingData.type === 'reply' ? 'Reply' : 'Comment'}</h3>
              <p className="text-sm text-gray-600 mb-4">Help us keep our community safe by reporting inappropriate content.</p>
              
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="What's the issue with this comment? (e.g., spam, offensive, off-topic)"
                    className="slot-textarea w-full"
                    rows="3"
                  />
                </div>

                {commentError && (
                  <p className={`text-sm ${commentError.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {commentError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={commentLoading}
                    className="flex-1 px-4 py-2 blocky-button blocky-button-primary text-sm"
                  >
                    {commentLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportingData(null);
                      setReportReason('');
                      setCommentError('');
                    }}
                    className="flex-1 px-4 py-2 blocky-button blocky-button-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <Link to="/Dashboard">
            <button className="blocky-button blocky-button-secondary" style={{ maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', display: 'block' }}>
              ← BACK TO DASHBOARD
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
