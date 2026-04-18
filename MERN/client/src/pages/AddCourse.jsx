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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/Dashboard" className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="card" align="center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Add a New Course</h1>
            <p className="text-gray-600 mb-4">Fill in the course details below to add it to the system.</p>
            <p className="text-sm text-gray-500">Fields marked with * are required.</p>
          </div>
        </div>

        {/* Form */}
        <div className="card mt-12" align="center">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Class Code*
                </label>
                <div>
                  <input
                    type="text"
                    id="classCode"
                    name="classCode"
                    value={formData.classCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                    placeholder="EEL4744"
                    maxLength="7"
                  />
                </div>
              </div>

              <div className="text-center">
                <label htmlFor="courseName" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Course Name*
                </label>
                <div>
                  <input
                    type="text"
                    id="courseName"
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                    placeholder="Microprocessor Applications"
                  />
                </div>
              </div>

              <div className="text-center">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Description
                </label>
                <div>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                    placeholder="Course description (optional)"
                    rows="4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Instructor
                  </label>
                  <div>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      placeholder="Instructor name (optional)"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Credits
                  </label>
                  <div>
                    <input
                      type="number"
                      id="credits"
                      name="credits"
                      value={formData.credits}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      min="1"
                      max="5"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-center">
                {success}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Course'}
              </button>
              <Link
                to="/Dashboard"
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
