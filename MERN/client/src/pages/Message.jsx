import { Link } from 'react-router-dom';

export default function Message() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1>Message</h1>
        <p>This page is empty for now.</p>
        <Link className="home-link" to="/Dashboard">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
