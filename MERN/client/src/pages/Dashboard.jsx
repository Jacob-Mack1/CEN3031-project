import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('gatorlinkLoggedIn');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  return (
    <div className="dashboard-page">
      {/* Avatar in top-left corner */}
      {user && user.avatar && (
        <Link
          to="/account-settings"
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 100,
            textDecoration: 'none',
          }}
          title="Click to edit account settings"
        >
          <img
            src={user.avatar}
            alt="User Avatar"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '2px solid #3758f9',
              cursor: 'pointer',
              objectFit: 'cover',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          />
        </Link>
      )}

      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>Gatorlink</h1>
          <p>Welcome back — choose an option to continue.</p>
        </div>

        <div className="dashboard-actions">
          <Link className="dashboard-action" to="/search">
            Search
          </Link>
          <Link className="dashboard-action" to="/add-course">
            Add course
          </Link>
          <Link className="dashboard-action" to="/message">
            Message
          </Link>
        </div>

        <div className="signout-area">
          <button className="auth-button" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
