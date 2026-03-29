import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('gatorlinkLoggedIn');
    navigate('/');
  };

  return (
    <div className="dashboard-page">
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
