import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import creatureImage from '../Images/tbh-creature-ddr.gif';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('gatorlinkLoggedIn') === 'true') {
      navigate('/Dashboard');
    }
  }, [navigate]);

  return (
    <div className="home-container">
      <header className="hero-section">
        <h1 className="hero-title">Welcome to GatorLink</h1>
        <p className="hero-subtitle">Connect with fellow Gators and share your experiences</p>
      </header>
      <main className="main-content">
        <div className="cta-section">
          <Link to="/Login" className="btn btn-primary">Log In</Link>
          <Link to="/SignUp" className="btn btn-secondary">Sign Up</Link>
        </div>
        <div className="features">
          <div className="feature">
            <h3>Connect</h3>
            <p>Build your network with students and alumni.</p>
          </div>
          <div className="feature">
            <h3>Share</h3>
            <p>Post updates, events, and opportunities.</p>
          </div>
          <div className="feature">
            <h3>Discover</h3>
            <p>Find resources and communities on campus.</p>
          </div>
        </div>
      </main>
    </div>
  );
}