import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <h1>Welcome to GatorLink</h1>
      <div>
        <Link 
          to="/Login" 
        >
          Log In
        </Link>
        <br />
        <Link 
          to="/SignUp" 
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}