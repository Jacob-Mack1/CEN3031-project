import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function AddCourse() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
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
  const [fieldErrors, setFieldErrors] = useState({});

  const steps = [
    { number: 1, label: 'Class Code', field: 'classCode', required: true },
    { number: 2, label: 'Course Name', field: 'courseName', required: true },
    { number: 3, label: 'Description', field: 'description', required: false },
    { number: 4, label: 'Instructor', field: 'instructor', required: false },
    { number: 5, label: 'Credits', field: 'credits', required: true },
  ];

  const currentStepConfig = steps[currentStep - 1];

  const validateClassCode = (code) => {
    const codeRegex = /^[A-Z]{3}\d{4}$/;
    return codeRegex.test(code);
  };

  const validateField = (field, value) => {
    if (field === 'classCode') {
      if (!value.trim()) return 'Class code is required.';
      if (!validateClassCode(value)) {
        return 'Invalid format. Please enter 3 letters followed by 4 numbers (e.g., EEL4744).';
      }
    } else if (field === 'courseName') {
      if (!value.trim()) return 'Course name is required.';
    } else if (field === 'credits') {
      if (!value || value < 1 || value > 5) return 'Credits must be between 1 and 5.';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { value } = e.target;
    const field = currentStepConfig.field;
    const newValue = field === 'classCode' ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }));
    
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    setError('');
  };

  const handleNextStep = () => {
    const field = currentStepConfig.field;
    const value = formData[field];
    const error = validateField(field, value);

    if (error) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: error
      }));
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      setFieldErrors({});
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentStep < steps.length) {
      e.preventDefault();
      handleNextStep();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    // Validate all fields
    const errors = {};
    steps.forEach(step => {
      const error = validateField(step.field, formData[step.field]);
      if (error) errors[step.field] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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
    <div 
      className="flex items-center justify-center"
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#F0F7FF',
        margin: 0,
        padding: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >


      <div className="p-6" style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div className="mb-0">
          <div className="blocky-card active p-8" style={{ backgroundColor: '#ffffff' }}>
            <div className="step-title">Add New Course</div>
            <div className="step-count">STEP {currentStep} OF {steps.length}</div>
          </div>
        </div>

        {/* Completed Steps as Collapsed Blocks */}
        {steps.map((step) => (
          currentStep > step.number && (
            <div key={`collapsed-${step.number}`} className="collapsed-block completed" style={{ marginBottom: '0px', backgroundColor: '#ffffff' }}>
              <div>
                <strong style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                  ✓ {step.label}
                </strong>
                <div style={{ fontSize: '14px', marginTop: '4px', color: '#666' }}>
                  {step.field === 'classCode' && formData.classCode}
                  {step.field === 'courseName' && formData.courseName}
                  {step.field === 'credits' && `${formData.credits} credits`}
                  {!['classCode', 'courseName', 'credits'].includes(step.field) && 
                    (formData[step.field] ? formData[step.field].substring(0, 50) + (formData[step.field].length > 50 ? '...' : '') : '(optional)')}
                </div>
              </div>
              <span style={{ fontSize: '20px' }}>▼</span>
            </div>
          )
        ))}

        {/* Active Step Block */}
        <div className="blocky-card active p-8 snap-in" style={{ backgroundColor: '#ffffff', paddingBottom: '2rem' }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Field Content */}
            <div>
              <label className="field-label">
                {currentStepConfig.label}
                {currentStepConfig.required && <span className="required-star">*</span>}
              </label>

              {currentStep === 1 && (
                <>
                  <input
                    type="text"
                    id="classCode"
                    value={formData.classCode}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="slot-input w-full"
                    placeholder="[CLASS CODE]"
                    maxLength="7"
                    autoFocus
                  />
                  {fieldErrors.classCode ? (
                    <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-error-500)' }}>
                      ✗ {fieldErrors.classCode}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs font-semibold" style={{ color: '#666' }}>
                      FORMAT: ABC1234
                    </p>
                  )}
                </>
              )}

              {currentStep === 2 && (
                <>
                  <input
                    type="text"
                    id="courseName"
                    value={formData.courseName}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="slot-input w-full"
                    placeholder="[COURSE NAME]"
                    autoFocus
                  />
                  {fieldErrors.courseName && (
                    <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-error-500)' }}>
                      ✗ {fieldErrors.courseName}
                    </p>
                  )}
                </>
              )}

              {currentStep === 3 && (
                <>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="slot-textarea w-full"
                    placeholder="[COURSE DESCRIPTION - OPTIONAL]"
                    rows="5"
                    autoFocus
                  />
                  <p className="mt-3 text-xs font-semibold" style={{ color: '#999' }}>
                    OPTIONAL FIELD
                  </p>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <input
                    type="text"
                    id="instructor"
                    value={formData.instructor}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="slot-input w-full"
                    placeholder="[INSTRUCTOR NAME - OPTIONAL]"
                    autoFocus
                  />
                  <p className="mt-3 text-xs font-semibold" style={{ color: '#999' }}>
                    OPTIONAL FIELD
                  </p>
                </>
              )}

              {currentStep === 5 && (
                <>
                  <input
                    type="number"
                    id="credits"
                    value={formData.credits}
                    onChange={handleInputChange}
                    className="slot-input w-full"
                    placeholder="[CREDITS: 1-5]"
                    min="1"
                    max="5"
                    autoFocus
                  />
                  {fieldErrors.credits ? (
                    <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-error-500)' }}>
                      ✗ {fieldErrors.credits}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs font-semibold" style={{ color: '#666' }}>
                      RANGE: 1-5
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <div 
                className="blocky-card p-4"
                style={{
                  borderColor: 'var(--color-error-500)',
                  backgroundColor: '#fef2f2'
                }}
              >
                <p className="font-bold text-sm" style={{ color: 'var(--color-error-500)' }}>
                  ✗ ERROR: {error}
                </p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div 
                className="blocky-card p-4"
                style={{
                  borderColor: 'var(--color-success-500)',
                  backgroundColor: '#f0fdf4'
                }}
              >
                <p className="font-bold text-sm" style={{ color: 'var(--color-success-500)' }}>
                  ✓ SUCCESS: {success}
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 justify-center items-center pt-8 w-full">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="blocky-button blocky-button-secondary"
                >
                  ← BACK
                </button>
              ) : null}

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="blocky-button blocky-button-primary"
                >
                  NEXT →
                </button>
              ) : (
                <div className="flex gap-4">
                  <Link
                    to="/Dashboard"
                    className="blocky-button blocky-button-secondary flex items-center justify-center"
                  >
                    CANCEL
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="blocky-button blocky-button-success"
                  >
                    {loading ? '⏳ SUBMITTING...' : '⚡ SUBMIT'}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
