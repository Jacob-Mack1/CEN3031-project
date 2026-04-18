import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: null,
    avatarPreview: null,
    anonymous: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const steps = [
    { number: 1, label: "Username", field: "username", required: true },
    { number: 2, label: "Email", field: "email", required: true },
    { number: 3, label: "Password", field: "password", required: true },
    { number: 4, label: "Profile Picture", field: "avatar", required: false },
    { number: 5, label: "Confirm", field: "confirm", required: true },
  ];

  const currentStepConfig = steps[currentStep - 1];

  const validateUsername = (username) => {
    if (!username.trim()) return "Username is required.";
    if (username.length < 3) return "Username must be at least 3 characters.";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Username can only contain letters, numbers, and underscores.";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const validateConfirmPassword = () => {
    if (!formData.confirmPassword) return "Please confirm your password.";
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }
    return "";
  };

  const validateField = (field, value) => {
    if (field === "username") {
      return validateUsername(value);
    } else if (field === "email") {
      return validateEmail(value);
    } else if (field === "password") {
      return validatePassword(value);
    } else if (field === "confirm") {
      return validateConfirmPassword();
    }
    return "";
  };

  const checkUsernameUniqueness = async (username) => {
    try {
      const response = await fetch(`http://localhost:5050/record/check-username/${username}`);
      if (!response.ok) {
        console.warn(`Uniqueness check returned ${response.status}`, response);
        return true; // Assume unique if check fails
      }
      const data = await response.json();
      return !data.exists;
    } catch (err) {
      console.error("Error checking username:", err);
      return true;
    }
  };

  const checkEmailUniqueness = async (email) => {
    try {
      const response = await fetch(`http://localhost:5050/record/check-email/${email}`);
      if (!response.ok) {
        console.warn(`Uniqueness check returned ${response.status}`, response);
        return true; // Assume unique if check fails
      }
      const data = await response.json();
      return !data.exists;
    } catch (err) {
      console.error("Error checking email:", err);
      return true;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    setError("");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatar: file,
          avatarPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatar: file,
          avatarPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = async () => {
    const field = currentStepConfig.field;
    const value = formData[field];
    let error = validateField(field, value);

    if (!error) {
      // Check uniqueness for username and email on step advance
      if (field === "username") {
        const isUnique = await checkUsernameUniqueness(value);
        if (!isUnique) {
          error = "This username is already taken.";
        }
      } else if (field === "email") {
        const isUnique = await checkEmailUniqueness(value);
        if (!isUnique) {
          error = "This email is already registered.";
        }
      }
    }

    if (error) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setError("");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
      setFieldErrors({});
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && currentStep < steps.length) {
      e.preventDefault();
      handleNextStep();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate all fields
    const errors = {};
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.field === "confirm") {
        const err = validateConfirmPassword();
        if (err) errors[step.field] = err;
      } else if (step.required) {
        const err = validateField(step.field, formData[step.field]);
        if (err) errors[step.field] = err;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        anonymous: formData.anonymous,
        avatar: formData.avatarPreview || null,
      };

      console.log("Submitting signup with payload:", {
        ...payload,
        avatar: payload.avatar ? `[base64 image ${payload.avatar.length} chars]` : null,
      });

      const response = await fetch("http://localhost:5050/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Signup response status:", response.status);

      const data = await response.json();
      console.log("Signup response data:", data);

      if (!response.ok) {
        const errorMsg = data.error || `Server error: ${response.status}`;
        console.error("Signup failed:", errorMsg);
        setError(errorMsg);
        return;
      }

      setSuccess("Account created successfully!");
      localStorage.setItem("gatorlinkLoggedIn", "true");
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      setTimeout(() => {
        navigate("/Dashboard");
      }, 2000);
    } catch (err) {
      const errorMsg = `Network error: ${err.message}`;
      console.error("Signup error:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#F0F7FF",
        margin: 0,
        padding: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="p-6" style={{ maxWidth: "1200px" }}>
        {/* Header */}
        <div className="mb-0">
          <div className="blocky-card active p-8" style={{ backgroundColor: "#ffffff" }}>
            <div className="step-title">Create Account</div>
            <div className="step-count">STEP {currentStep} OF {steps.length}</div>
          </div>
        </div>

        {/* Completed Steps as Collapsed Blocks */}
        {steps.map((step) => (
          currentStep > step.number && (
            <div key={`collapsed-${step.number}`} className="collapsed-block completed" style={{ marginBottom: "0px", backgroundColor: "#ffffff" }}>
              <div>
                <strong style={{ textTransform: "uppercase", fontSize: "12px" }}>
                  ✓ {step.label}
                </strong>
                <div style={{ fontSize: "14px", marginTop: "4px", color: "#666" }}>
                  {step.field === "username" && formData.username}
                  {step.field === "email" && formData.email}
                  {step.field === "password" && "••••••••"}
                  {step.field === "avatar" &&
                    (formData.avatarPreview ? "Profile picture added" : "(optional)")}
                  {step.field === "confirm" &&
                    (formData.anonymous ? "Anonymous account" : "Public account")}
                </div>
              </div>
              <span style={{ fontSize: "20px" }}>▼</span>
            </div>
          )
        ))}

        {/* Active Step Block */}
        <div className="blocky-card active p-8 snap-in" style={{ backgroundColor: "#ffffff", paddingBottom: "2rem" }}>
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
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="slot-input w-full"
                    placeholder="[USERNAME]"
                    autoFocus
                  />
                  {fieldErrors.username ? (
                    <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-error-500)" }}>
                      ✗ {fieldErrors.username}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs font-semibold" style={{ color: "#666" }}>
                      3+ characters, letters/numbers/_
                    </p>
                  )}
                </>
              )}

              {currentStep === 2 && (
                <>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="slot-input w-full"
                    placeholder="[EMAIL ADDRESS]"
                    autoFocus
                  />
                  {fieldErrors.email ? (
                    <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-error-500)" }}>
                      ✗ {fieldErrors.email}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs font-semibold" style={{ color: "#666" }}>
                      example@email.com
                    </p>
                  )}
                </>
              )}

              {currentStep === 3 && (
                <>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="slot-input w-full"
                    placeholder="[PASSWORD]"
                    autoFocus
                  />
                  {fieldErrors.password ? (
                    <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-error-500)" }}>
                      ✗ {fieldErrors.password}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs font-semibold" style={{ color: "#666" }}>
                      CONFIRM PASSWORD
                    </p>
                  )}
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="slot-input w-full mt-4"
                    placeholder="[CONFIRM PASSWORD]"
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-error-500)" }}>
                      ✗ {fieldErrors.confirmPassword}
                    </p>
                  )}
                </>
              )}

              {currentStep === 4 && (
                <>
                  <div
                    className="blocky-card"
                    style={{
                      padding: "24px",
                      backgroundColor: "#fafbfc",
                      cursor: "pointer",
                      border: "2px dashed #3758f9",
                    }}
                    onDrop={handleAvatarDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <input
                      type="file"
                      id="avatar"
                      name="avatar"
                      onChange={handleAvatarChange}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                    <label htmlFor="avatar" style={{ cursor: "pointer", display: "block" }}>
                      {formData.avatarPreview ? (
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <img
                            src={formData.avatarPreview}
                            alt="Avatar preview"
                            style={{
                              width: "120px",
                              height: "120px",
                              borderRadius: "8px",
                              objectFit: "cover",
                              border: "3px solid #3758f9",
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "24px" }}>
                          <p style={{ fontSize: "14px", fontWeight: "bold", color: "#666" }}>
                            📸 DRAG & DROP YOUR IMAGE
                          </p>
                          <p style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
                            or click to select
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  <p className="mt-3 text-xs font-semibold" style={{ color: "#999" }}>
                    OPTIONAL - JPG, PNG, GIF
                  </p>
                </>
              )}

              {currentStep === 5 && (
                <>
                  <div
                    className="blocky-card"
                    style={{
                      padding: "20px",
                      backgroundColor: "#f8fafb",
                      border: "2px solid #ccc",
                    }}
                  >
                    <div className="form-field checkbox-field" style={{ marginBottom: 0 }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "14px",
                          textTransform: "uppercase",
                        }}
                      >
                        <input
                          id="anonymous"
                          type="checkbox"
                          name="anonymous"
                          checked={formData.anonymous}
                          onChange={handleInputChange}
                          style={{
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                          }}
                        />
                        Mark as anonymous account
                      </label>
                    </div>
                    <p style={{ fontSize: "12px", color: "#666", marginTop: "12px" }}>
                      Your username will be hidden from other users
                    </p>
                  </div>
                  <p className="mt-3 text-xs font-semibold" style={{ color: "#666" }}>
                    REVIEW YOUR INFORMATION ABOVE BEFORE SUBMITTING
                  </p>
                </>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <div
                className="blocky-card p-4"
                style={{
                  borderColor: "var(--color-error-500)",
                  backgroundColor: "#fef2f2",
                }}
              >
                <p className="font-bold text-sm" style={{ color: "var(--color-error-500)" }}>
                  ✗ ERROR: {error}
                </p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div
                className="blocky-card p-4"
                style={{
                  borderColor: "var(--color-success-500)",
                  backgroundColor: "#f0fdf4",
                }}
              >
                <p className="font-bold text-sm" style={{ color: "var(--color-success-500)" }}>
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
                    to="/Login"
                    className="blocky-button blocky-button-secondary flex items-center justify-center"
                  >
                    CANCEL
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="blocky-button blocky-button-success"
                  >
                    {loading ? "⏳ CREATING..." : "⚡ CREATE ACCOUNT"}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#666" }}>
          Already have an account?{" "}
          <Link to="/Login" style={{ color: "#3758f9", fontWeight: "600", textDecoration: "none" }}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
