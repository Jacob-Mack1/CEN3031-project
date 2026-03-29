import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch("http://localhost:5050/record/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: formData.email.trim(), password: formData.password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setErrors({ form: errorData.error || "Invalid login" });
          return;
        }

        const data = await response.json();
        console.log("Login success:", data);

        setSubmitted(true);
        setFormData({ email: "", password: "" });
        setTimeout(() => setSubmitted(false), 3000);
      } catch (error) {
        console.error(error);
        setErrors({ form: "Unable to login at this time. Try again." });
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <h1 className="auth-heading">Login</h1>
          <p className="auth-text">Enter your details to access your GatorLink dashboard.</p>
        </div>

        {errors.form && <div className="form-error">{errors.form}</div>}
        {submitted && <div className="success-message">Login successful!</div>}

        <form onSubmit={handleSubmit}>
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

          <button type="submit" className="auth-button">
            Login
          </button>
        </form>

        <p className="auth-note">
          Don't have an account? <Link className="auth-link" to="/SignUp">Sign up here</Link>
        </p>

        <Link className="home-link" to="/">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
