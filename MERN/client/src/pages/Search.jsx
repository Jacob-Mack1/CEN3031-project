import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Search() {
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const regex = /^[A-Z]{3}\d{4}$/;
    if (!regex.test(classCode)) {
      setError('Invalid class code. Please enter 3 letters followed by 4 numbers (e.g., EEL4744).');
      return;
    }
    setError('');
    
    // TODO: Implement search functionality here
    console.log('Searching for class:', classCode);
  };

  const handleChange = (e) => {
    setClassCode(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1>Search for a Class</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="classCode" className="block text-sm font-medium text-gray-700">
              Enter Class Code
            </label>
            <input
              type="text"
              id="classCode"
              value={classCode}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., EEL4744"
            />
            <p className="mt-2 text-sm text-gray-500">
              Example: EEL4744
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Search
          </button>
        </form>
        <Link className="home-link" to="/Dashboard">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
