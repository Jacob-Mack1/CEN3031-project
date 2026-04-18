import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AccountSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    avatar: null,
    avatarPreview: null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
          username: parsedUser.username || "",
          email: parsedUser.email || "",
          avatar: null,
          avatarPreview: parsedUser.avatar || null,
        });
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        avatar: formData.avatarPreview || null, // Send base64 data URL or null
      };

      const response = await fetch(`http://localhost:5050/record/${user._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update account");
        return;
      }

      setSuccess("Account updated successfully!");
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setTimeout(() => {
        navigate("/Dashboard");
      }, 2000);
    } catch (err) {
      setError("An error occurred while updating your account. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{
        minHeight: "100vh",
        backgroundColor: "#F0F7FF",
        padding: "2rem",
      }}
    >
      <div className="p-6" style={{ maxWidth: "800px", width: "100%" }}>
        {/* Header */}
        <div className="mb-6">
          <div className="blocky-card active p-8" style={{ backgroundColor: "#ffffff" }}>
            <div className="step-title">Account Settings</div>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
              Manage your profile information
            </p>
          </div>
        </div>

        {/* Account Card */}
        <div className="blocky-card active p-8" style={{ backgroundColor: "#ffffff" }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Section */}
            <div>
              <label className="field-label">Profile Picture</label>
              <div
                className="blocky-card"
                style={{
                  padding: "24px",
                  backgroundColor: "#fafbfc",
                  border: "2px dashed #3758f9",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  onChange={handleAvatarChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <label htmlFor="avatar" style={{ cursor: "pointer" }}>
                  {formData.avatarPreview ? (
                    <img
                      src={formData.avatarPreview}
                      alt="Avatar"
                      style={{
                        width: "150px",
                        height: "150px",
                        borderRadius: "8px",
                        objectFit: "cover",
                        border: "3px solid #3758f9",
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: "center", padding: "24px" }}>
                      <p style={{ fontSize: "14px", fontWeight: "bold", color: "#666" }}>
                        📸 CLICK TO CHANGE PHOTO
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="field-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="slot-input w-full"
                placeholder="[USERNAME]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="slot-input w-full"
                placeholder="[EMAIL ADDRESS]"
              />
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
              <Link
                to="/Dashboard"
                className="blocky-button blocky-button-secondary flex items-center justify-center"
              >
                ← BACK
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="blocky-button blocky-button-success"
              >
                {loading ? "⏳ SAVING..." : "⚡ SAVE CHANGES"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
