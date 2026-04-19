import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MessagingSystem from './MessagingSystem';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [followedCourses, setFollowedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Fetch followed courses from backend using user ID
        if (parsedUser._id) {
          fetchFollowedCourses(parsedUser._id);
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
        setError('Failed to load user data');
        setLoading(false);
      }
    } else {
      // No user logged in, redirect to login
      navigate('/Login');
      setLoading(false);
    }
  }, [navigate]);

  // Refresh followed courses when page comes into focus
  useEffect(() => {
    const handleFocus = () => {
      if (user && user._id) {
        fetchFollowedCourses(user._id);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const fetchFollowedCourses = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5050/record/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      
      // Update user data with latest from server
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Set followed courses from server
      const courses = userData.followedCourses || [];
      setFollowedCourses(courses);
      setError(null);
    } catch (err) {
      console.error('Error fetching followed courses:', err);
      setError('Failed to load followed courses');
      
      // Fallback to localStorage if fetch fails
      const savedFollowed = localStorage.getItem('followedCourses');
      if (savedFollowed) {
        try {
          setFollowedCourses(JSON.parse(savedFollowed));
        } catch (parseErr) {
          console.error('Error loading fallback courses:', parseErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('gatorlinkLoggedIn');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleRemoveCourse = async (courseId) => {
    try {
      // Call backend to unfollow the course
      const response = await fetch(`http://localhost:5050/record/${user._id}/follow-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: courseId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove course');
      }

      const data = await response.json();
      
      // Update user and followed courses from server response
      setUser(data.user);
      setFollowedCourses(data.user.followedCourses || []);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    } catch (err) {
      console.error('Error removing course:', err);
      setError('Failed to remove course. Please try again.');
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="dashboard-page">
      {/* Left Sidebar */}
      <div className="dashboard-sidebar">
        {/* User Avatar & Settings */}
        <div className="sidebar-user-section">
          <Link
            to="/account-settings"
            className="account-settings-button"
            title="Click to edit account settings"
          >
            <div className="account-settings-avatar">
              {user && user.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>
            <span className="account-settings-text">ACCOUNT SETTINGS</span>
          </Link>
        </div>

        {/* Search & Add Course Buttons */}
        <div className="sidebar-actions">
          <button
            className="sidebar-button blocky-button blocky-button-secondary"
            onClick={() => navigate('/search')}
            title="Search for courses"
          >
            🔍 SEARCH
          </button>
          <button
            className="sidebar-button blocky-button blocky-button-primary"
            onClick={() => navigate('/add-course')}
            title="Add a new course"
          >
            + ADD COURSE
          </button>
        </div>

        {/* Sign Out Button */}
        <button
          className="sidebar-button blocky-button blocky-button-secondary sidebar-signout"
          onClick={handleSignOut}
          title="Sign out of your account"
        >
          SIGN OUT
        </button>
      </div>

      {/* Vertical Divider */}
      <div className="dashboard-divider"></div>

      {/* Main Feed Container */}
      <div className="feed-container">
        <div className="feed-header">
          <h2>MY FOLLOWED COURSES</h2>
        </div>

        {error && (
          <div className="blocky-card p-4" style={{ borderColor: '#ef4444', backgroundColor: '#fef2f2', marginBottom: '16px' }}>
            <p style={{ color: '#ef4444', margin: 0 }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="empty-state-card blocky-card">
            <p style={{ marginTop: '16px' }}>Loading your courses...</p>
          </div>
        ) : followedCourses.length === 0 ? (
          <div className="empty-state-card blocky-card">
            <div className="empty-state-icon">📚</div>
            <h3 className="empty-state-title">No Courses Yet!</h3>
            <p className="empty-state-message">
              No courses are currently being followed! Search for courses to add!
            </p>
            <button
              className="blocky-button blocky-button-primary"
              onClick={() => navigate('/search')}
              style={{ marginTop: '16px' }}
            >
              🔍 SEARCH COURSES
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {followedCourses.map((course) => (
              <div key={course._id} className="course-card blocky-card">
                <div
                  className="course-info"
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => handleCourseClick(course._id)}
                >
                  <h3 className="course-name">{course.classCode}</h3>
                  <p className="course-instructor">{course.courseName}</p>
                </div>
                <button
                  className="blocky-button blocky-button-secondary"
                  onClick={() => handleRemoveCourse(course._id)}
                  title="Remove course from followed"
                  style={{ padding: '12px 16px', fontSize: '12px' }}
                >
                  × REMOVE
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Messaging System */}
      <MessagingSystem user={user} />
    </div>
  );
}
