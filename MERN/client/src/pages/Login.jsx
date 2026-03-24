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
    <div>
      <div>
        <h1>
          Login
        </h1>

        {errors.form && (
          <div style={{ color: "red", marginBottom: "10px" }}>
            {errors.form}
          </div>
        )}
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