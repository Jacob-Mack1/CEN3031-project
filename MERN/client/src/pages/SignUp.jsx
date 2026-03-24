import { useState } from "react";

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
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
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        setTimeout(() => setSubmitted(false), 3000);
      } catch (error) {
        console.error(error);
        setErrors({ form: "Unable to create account at this time. Try again." });
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div>
      <div>
        <h1>
          Create an Account
        </h1>

        {errors.form && (
          <div style={{ color: "red", marginBottom: "10px" }}>
            {errors.form}
          </div>
        )}
        {submitted && (
          <div>
            Account created successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label>
              First Name:
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First"
            />
            {errors.firstName && (
              <p>{errors.firstName}</p>
            )}
          </div>

          <div>
            <label>
              Last Name:
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last"
            />
            {errors.lastName && (
              <p>{errors.lastName}</p>
            )}
          </div>

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

          <div>
            <label>
              Confirm Password:
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && (
              <p>{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
          >
            Sign Up
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <a href="/login">
            Login here
          </a>
        </p>

        <a href="/Home">
          Back to Home
        </a>
      </div>
    </div>
  );
}