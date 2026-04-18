import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [followedCourses, setFollowedCourses] = useState([]);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Dr. Smith', text: 'Great work on your last assignment!' },
    { id: 2, sender: 'Study Group', text: 'Meeting at 3pm today?' },
    { id: 3, sender: 'Prof. Johnson', text: 'Your project submission was excellent.' },
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
    
    // Fetch followed courses from backend
    const fetchFollowedCourses = async () => {
      try {
        const userId = user?._id;
        if (!userId) return;
        
        // TODO: Replace with actual backend endpoint when course system is implemented
        // const response = await fetch(`http://localhost:5050/courses/followed/${userId}`);
        // const data = await response.json();
        // setFollowedCourses(data);
        
        // For now, initialize as empty
        setFollowedCourses([]);
      } catch (err) {
        console.error('Error fetching followed courses:', err);
        setFollowedCourses([]);
      }
    };
    
    fetchFollowedCourses();
  }, [user]);

  const handleSignOut = () => {
    localStorage.removeItem('gatorlinkLoggedIn');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const toggleCourseFollow = (courseId) => {
    setFollowedCourses(
      followedCourses.map((course) =>
        course.id === courseId ? { ...course, followed: !course.followed } : course
      )
    );
  };

  const toggleMessenger = () => {
    setIsMessengerOpen(!isMessengerOpen);
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

        {followedCourses.length === 0 ? (
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
              <div key={course.id} className="course-card blocky-card">
                <div className="course-info">
                  <h3 className="course-name">{course.name}</h3>
                  <p className="course-instructor">Instructor: {course.instructor}</p>
                </div>
                <button
                  className={`follow-button blocky-button ${
                    course.followed ? 'blocky-button-success' : 'blocky-button-secondary'
                  }`}
                  onClick={() => toggleCourseFollow(course.id)}
                >
                  {course.followed ? '✓ FOLLOWING' : 'FOLLOW'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mini-Messenger Widget */}
      <div className={`messenger-widget ${isMessengerOpen ? 'messenger-expanded' : 'messenger-collapsed'}`}>
        {isMessengerOpen ? (
          <>
            <div className="messenger-header">
              <h3>MESSAGES</h3>
              <button className="messenger-close-btn" onClick={toggleMessenger}>
                ✕
              </button>
            </div>
            <div className="messenger-content">
              {messages.map((msg) => (
                <div key={msg.id} className="message-item">
                  <p className="message-sender">{msg.sender}</p>
                  <p className="message-text">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="messenger-input-container">
              <input
                type="text"
                className="messenger-input slot-input"
                placeholder="Type a message..."
              />
              <button className="messenger-send-btn blocky-button blocky-button-primary">
                SEND
              </button>
            </div>
          </>
        ) : (
          <button className="messenger-toggle-btn" onClick={toggleMessenger} title="Open messages">
            💬
          </button>
        )}
      </div>
    </div>
  );
}
