import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
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

        localStorage.setItem("gatorlinkLoggedIn", "true");
        navigate("/Dashboard");
      } catch (error) {
        console.error(error);
        setErrors({ form: "Unable to login at this time. Try again." });
      }
    } else {
      setErrors(newErrors);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("gatorlinkLoggedIn") === "true") {
      navigate("/Dashboard");
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center" style={{ height: "100vh", width: "100vw", backgroundColor: "#F0F7FF", margin: 0, padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="p-6" style={{ maxWidth: "420px", width: "100%" }}>
        <div className="blocky-card active p-8" style={{ backgroundColor: "#ffffff" }}>
          <div className="step-title" style={{ textAlign: "center" }}>Welcome Back</div>
          <div className="step-count" style={{ textAlign: "center", marginBottom: "18px" }}>LOGIN TO YOUR ACCOUNT</div>

          {/* Error Alert */}
          {errors.form && (
            <div className="blocky-card p-4" style={{ borderColor: "var(--color-error-500)", backgroundColor: "#fef2f2", marginBottom: "18px" }}>
              <p className="font-bold text-sm" style={{ color: "var(--color-error-500)" }}>
                ✗ ERROR: {errors.form}
              </p>
            </div>
          )}
          {/* Success Alert */}
          {submitted && (
            <div className="blocky-card p-4" style={{ borderColor: "var(--color-success-500)", backgroundColor: "#f0fdf4", marginBottom: "18px" }}>
              <p className="font-bold text-sm" style={{ color: "var(--color-success-500)" }}>
                ✓ SUCCESS: Login successful!
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="form-field">
              <label htmlFor="email" className="field-label">Email <span className="required-star">*</span></label>
              <input
                id="email"
                className="slot-input w-full"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="[EMAIL ADDRESS]"
                autoFocus
              />
              {errors.email ? (
                <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-error-500)" }}>
                  ✗ {errors.email}
                </p>
              ) : (
                <p className="mt-3 text-xs font-semibold" style={{ color: "#666" }}>
                  example@email.com
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="password" className="field-label">Password <span className="required-star">*</span></label>
              <input
                id="password"
                className="slot-input w-full"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="[PASSWORD]"
              />
              {errors.password ? (
                <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-error-500)" }}>
                  ✗ {errors.password}
                </p>
              ) : (
                <p className="mt-3 text-xs font-semibold" style={{ color: "#666" }}>
                  6+ characters
                </p>
              )}
            </div>

            <button type="submit" className="blocky-button blocky-button-primary w-full" style={{ marginTop: "12px" }}>
              LOGIN
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#666" }}>
            Don't have an account?{' '}
            <Link to="/SignUp" style={{ color: "#3758f9", fontWeight: "600", textDecoration: "none" }}>
              Sign up here
            </Link>
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
            <Link className="home-link" to="/">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
