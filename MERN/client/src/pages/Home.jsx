import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to My App</h1>
      <div className="flex gap-4">
        <Link 
          to="/Login" 
          className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
        >
          Log In
        </Link>
        
        <Link 
          to="/SignUp" 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          Sign Up Free
        </Link>
      </div>
    </div>
  );
}