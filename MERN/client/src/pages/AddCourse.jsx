import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function AddCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    classCode: '',
    courseName: '',
    description: '',
    instructor: '',
    credits: 3,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' ? parseInt(value) : value.toUpperCase()
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate class code format
    const codeRegex = /^[A-Z]{3}\d{4}$/;
    if (!codeRegex.test(formData.classCode)) {
      setError('Invalid class code format. Please enter 3 letters followed by 4 numbers (e.g., EEL4744).');
      return;
    }

    if (!formData.courseName.trim()) {
      setError('Course name is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5050/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add course');
        return;
      }

      setSuccess(`Course "${formData.courseName}" (${formData.classCode}) has been added successfully!`);
      setFormData({
        classCode: '',
        courseName: '',
        description: '',
        instructor: '',
        credits: 3,
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/Dashboard');
      }, 2000);
    } catch (err) {
      setError('An error occurred while adding the course. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1>Add a New Course</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="classCode" className="block text-sm font-medium text-gray-700">
              Class Code *
            </label>
            <input
              type="text"
              id="classCode"
              name="classCode"
              value={formData.classCode}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., EEL4744"
              maxLength="7"
            />
            <p className="mt-1 text-sm text-gray-500">
              Format: 3 letters followed by 4 numbers
            </p>
          </div>

          <div>
            <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">
              Course Name *
            </label>
            <input
              type="text"
              id="courseName"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Embedded Systems"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Course description (optional)"
              rows="3"
            />
          </div>

          <div>
            <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">
              Instructor
            </label>
            <input
              type="text"
              id="instructor"
              name="instructor"
              value={formData.instructor}
              onChange={(e) => {
                const { name, value } = e.target;
                setFormData(prev => ({
                  ...prev,
                  [name]: value
                }));
                if (error) setError('');
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Instructor name (optional)"
            />
          </div>

          <div>
            <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
              Credits
            </label>
            <input
              type="number"
              id="credits"
              name="credits"
              value={formData.credits}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              min="1"
              max="6"
            />
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-2 text-sm text-green-600">{success}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Course'}
            </button>
            <Link
              to="/Dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
