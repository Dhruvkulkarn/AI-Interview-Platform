import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    createdAt: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          "https://ai-interview-platform-5e0s.onrender.com/api/auth/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("username");

          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load profile."
          );
        }

        setProfile(data.user);

        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          password: "",
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function handleCancel() {
    setFormData({
      name: profile.name || "",
      email: profile.email || "",
      password: "",
    });

    setError("");
    setSuccess("");
    setEditing(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email cannot be empty.");
      return;
    }

    if (
      formData.password &&
      formData.password.length < 6
    ) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://ai-interview-platform-5e0s.onrender.com/api/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("username");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update profile."
        );
      }

      setProfile(data.user);

      setFormData({
        name: data.user.name,
        email: data.user.email,
        password: "",
      });

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        "username",
        data.user.name
      );

      setSuccess("Profile updated successfully.");
      setEditing(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          {profile.name
            ? profile.name.charAt(0).toUpperCase()
            : "U"}
        </div>

        <h1>{profile.name}</h1>
        <p className="profile-role">Candidate</p>

        {error && (
          <p className="profile-message error-message">
            {error}
          </p>
        )}

        {success && (
          <p className="profile-message success-message">
            {success}
          </p>
        )}

        {!editing ? (
          <>
            <div className="profile-information">
              <div>
                <span>Full Name</span>
                <strong>{profile.name}</strong>
              </div>

              <div>
                <span>Email Address</span>
                <strong>{profile.email}</strong>
              </div>

              <div>
                <span>Account Created</span>
                <strong>
                  {profile.createdAt
                    ? new Date(
                        profile.createdAt
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Unavailable"}
                </strong>
              </div>
            </div>

            <button
              className="profile-edit-button"
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setEditing(true);
              }}
            >
              Edit Profile
            </button>
          </>
        ) : (
          <form
            className="profile-form"
            onSubmit={handleSubmit}
          >
            <div className="profile-form-group">
              <label htmlFor="profileName">
                Full Name
              </label>

              <input
                id="profileName"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="profileEmail">
                Email Address
              </label>

              <input
                id="profileEmail"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="profilePassword">
                New Password
              </label>

              <input
                id="profilePassword"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave empty to keep current password"
                disabled={saving}
              />

              <small>
                Enter at least 6 characters only when changing
                your password.
              </small>
            </div>

            <div className="profile-form-actions">
              <button
                className="profile-save-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                className="profile-cancel-button"
                type="button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;