import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    anonymous: false,
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      const payload = {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        position: "User",
        level: "New",
        anonymous: formData.anonymous,
        email: formData.email.trim(),
        password: formData.password,
      };

      try {
        const response = await fetch("http://localhost:5050/record", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to create signup record: ${response.status}`);
        }

        setSubmitted(true);
        localStorage.setItem("gatorlinkLoggedIn", "true");
        navigate("/Dashboard");
      } catch (error) {
        console.error(error);
        setErrors({ form: "Unable to create account at this time. Try again." });
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <h1 className="auth-heading">Create an Account</h1>
          <p className="auth-text">Create your GatorLink account and start connecting with fellow students.</p>
        </div>

        {errors.form && <div className="form-error">{errors.form}</div>}
        {submitted && <div className="success-message">Account created successfully!</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field checkbox-field">
            <label htmlFor="anonymous">
              <input
                id="anonymous"
                type="checkbox"
                name="anonymous"
                checked={formData.anonymous}
                onChange={handleChange}
              />
              Mark as anonymous account
            </label>
          </div>

          <div className="form-field">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              className="auth-input"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First"
            />
            {errors.firstName && <p className="field-error">{errors.firstName}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              className="auth-input"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last"
            />
            {errors.lastName && <p className="field-error">{errors.lastName}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="auth-input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nick@example.com"
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="auth-input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              className="auth-input"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
          </div>

          <button type="submit" className="auth-button">
            Sign Up
          </button>
        </form>

        <p className="auth-note">
          Already have an account? <Link className="auth-link" to="/Login">Login here</Link>
        </p>

        <Link className="home-link" to="/">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
