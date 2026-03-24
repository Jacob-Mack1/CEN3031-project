import { useState } from "react";

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setSubmitted(true);
      console.log("Form submitted:", formData);
      // Reset form
      setFormData({
        email: "",
        password: "",
      });
      // Reset submitted state after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div>
      <div>
        <h1>
          Login
        </h1>

        {submitted && (
          <div>
            Login successful!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label>
              Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nick@example.com"
            />
            {errors.email && (
              <p>{errors.email}</p>
            )}
          </div>

          <div>
            <label>
              Password:
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
            {errors.password && (
              <p>{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
          >
            Login
          </button>
        </form>

        <p>
          Don't have an account?{" "}
          <a href="/signup">
            Sign up here
          </a>
        </p>

        <a href="/Home">
          Back to Home
        </a>
      </div>
    </div>
  );
}