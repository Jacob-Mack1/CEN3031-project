import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [comments, setComments] = useState([]);
  const [followedCourses, setFollowedCourses] = useState([]);
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
    
    // Load followed courses from localStorage
    const saved = localStorage.getItem('followedCourses');
    if (saved) {
      try {
        setFollowedCourses(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading followed courses:', err);
      }
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
      const response = await fetch(`http://localhost:5050/courses/${courseId}/comments`, {
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
        `http://localhost:5050/courses/${courseId}/comments/${commentId}/replies`,
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFollowCourse = () => {
    if (!courseData) return;
    
    const isCourseFollowed = followedCourses.some(
      (course) => course._id === courseData._id || course.classCode === courseData.classCode
    );
    
    let updatedFollowed;
    if (isCourseFollowed) {
      updatedFollowed = followedCourses.filter(
        (course) => !(course._id === courseData._id || course.classCode === courseData.classCode)
      );
    } else {
      updatedFollowed = [...followedCourses, courseData];
    }
    
    setFollowedCourses(updatedFollowed);
    localStorage.setItem('followedCourses', JSON.stringify(updatedFollowed));
  };

  const isCourseFol = courseData && followedCourses.some(
    (course) => course._id === courseData._id || course.classCode === courseData.classCode
  );

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
            <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{marginTop: "0rem", marginBottom:"-1rem", textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em'}}>
              Discussion ({comments.length})
            </h2>

            {/* Comments List */}
            <div className="space-y-4 mb-6">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="space-y-2">
                    {/* Parent Comment */}
                    <div className="blocky-card bg-white p-4 border-l-4 border-indigo-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900" style={{marginBottom: '-0.5rem'}}><b>Name:</b> {comment.userName}</p>
                          {comment.email && <p className="text-xs text-gray-500" style={{marginBottom: '0rem', marginTop:'0.5rem'}}><b>Email:</b> {comment.email}</p>}
                        </div>
                        <span className="text-xs text-gray-500" style={{marginBottom:'-1rem'}}><b>Date: </b>{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 mb-3" style={{marginTop:'1rem', fontFamily:'Trebuchet MS'}}>{comment.commentText}</p>
                      {isLoggedIn && (
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
                          style={{border:'none', paddingLeft: '10px', paddingRight: '10px', paddingBottom: '3px', paddingTop: '3px' ,marginTop: '-0.5rem'}}
                        >
                          {replyingTo === comment._id ? 'Cancel Reply' : 'Reply'}
                        </button>
                      )}
                    </div>

                    {/* Reply Form */}
                    {isLoggedIn && replyingTo === comment._id && (
                      <div className="ml-6 blocky-card bg-white rounded-lg p-4">
                        <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="space-y-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Your name"
                              value={replyData.userName}
                              onChange={(e) => setReplyData({ ...replyData, userName: e.target.value })}
                              className="slot-input w-full"
                            />
                          </div>
                          <div>
                            <input
                              type="email"
                              placeholder="Email (optional)"
                              value={replyData.email}
                              onChange={(e) => setReplyData({ ...replyData, email: e.target.value })}
                              className="slot-input w-full"
                            />
                          </div>
                          <textarea
                            placeholder="Write your reply..."
                            value={replyData.replyText}
                            onChange={(e) => setReplyData({ ...replyData, replyText: e.target.value })}
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
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-6 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply._id} className="blocky-card bg-white p-4 border-l-4 border-gray-400">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-gray-900" style={{marginBottom: '0rem'}}><b>Name:</b> {reply.userName}</p>
                                {reply.email && <p className="text-xs text-gray-500" style={{marginBottom: '0rem', marginTop:'0rem'}}> <b>Email:</b> {reply.email}</p>}
                              </div>
                              <span className="text-xs text-gray-500"><b>Date:</b> {formatDate(reply.createdAt)}</span>
                            </div>
                            <p className="text-gray-700" style={{fontFamily:'Trebuchet MS'}}>{reply.replyText}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="blocky-card bg-white p-8 text-center">
                  <p className="text-gray-600 mb-2">No comments yet</p>
                  <p className="text-sm text-gray-500">Be the first to start the discussion!</p>
                </div>
              )}
            </div>

            {/* New Comment Form */}
            {isLoggedIn ? (
              <div className="blocky-card bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em'}}>Add Your Comment</h3>
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="newUserName" className="block text-sm font-medium text-gray-700 mb-1" style={{textTransform: 'uppercase', fontWeight: '700'}}>
                      Name *
                    </label>
                    <input
                      type="text"
                      id="newUserName"
                      value={newCommentData.userName}
                      onChange={(e) => setNewCommentData({ ...newCommentData, userName: e.target.value })}
                      className="slot-input w-full"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1" style={{textTransform: 'uppercase', fontWeight: '700'}}>
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      id="newEmail"
                      value={newCommentData.email}
                      onChange={(e) => setNewCommentData({ ...newCommentData, email: e.target.value })}
                      className="slot-input w-full"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="newCommentText" className="block text-sm font-medium text-gray-700 mb-1" style={{textTransform: 'uppercase', fontWeight: '700'}}>
                      Comment *
                    </label>
                    <textarea
                      id="newCommentText"
                      value={newCommentData.commentText}
                      onChange={(e) => setNewCommentData({ ...newCommentData, commentText: e.target.value })}
                      className="slot-textarea w-full"
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
                    className="w-full blocky-button blocky-button-primary"
                  >
                    {commentLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="blocky-card bg-white p-6 text-center">
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
