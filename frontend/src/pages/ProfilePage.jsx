import React, { useEffect, useState } from "react";
import api from "../api";
import { useParams } from "react-router-dom";

function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null); // Holds the profile data
  const [editing, setEditing] = useState(false); // Toggle edit mode
  const [formData, setFormData] = useState({
    profilename: "",
    email: "",
    profileimage: null, // For storing the selected image file
  });
  const [previewImage, setPreviewImage] = useState(null); // Holds the preview URL for the image

  const fetchProfile = async () => {
    try {
      const endPoint = id ? `/api/profile/${id}/` : `/api/profile/`;
      const response = await api.get(endPoint);
      if (!response.data) throw new Error("No profile data received.");
      const profileData = response.data;

      setProfile({
        profilename: profileData.profilename || "Your Name",
        email: profileData.user_email || "No Email",
        profileimage: profileData.profileimage || "/default-avatar.png",
        followers_count: profileData.followers_count || 0,
        following_count: profileData.following_count || 0,
        isOwner: profileData.isOwner || false,
        is_following: profileData.is_following || false, // Add is_following status
      });

      setFormData({
        profilename: profileData.profilename || "Your Name",
        email: profileData.user_email || "",
        profileimage: null, // Reset file input
      });

      setPreviewImage(null); // Reset preview
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      profilename: profile.profilename,
      email: profile.email,
      profileimage: null, // Reset file input
    });
    setPreviewImage(null); // Reset preview
  };

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("profilename", formData.profilename);
      formDataToSend.append("email", formData.email);

      if (formData.profileimage) {
        formDataToSend.append("profileimage", formData.profileimage);
      }

      const response = await api.put("/api/profile/", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data", // Specify multipart form data
        },
      });

      setProfile({
        ...profile,
        profilename: response.data.profilename,
        email: response.data.user_email,
        profileimage: response.data.profileimage || "/default-avatar.png",
        followers_count: response.data.followers_count,
        following_count: response.data.following_count,
      });

      setEditing(false); // Exit edit mode
      setPreviewImage(null); // Reset preview
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profileimage: file });
      setPreviewImage(URL.createObjectURL(file)); // Generate a preview URL
    }
  };

  const handleFollowToggle = async () => {
    try {
      const response = await api.put(`/api/profile/${id}/follow/`);
      console.log("Follow API Response:", response.data);
      setProfile((prevProfile) => ({
        ...prevProfile,
        is_following: response.data.is_following, // Update follow status
        followers_count: response.data.followers_count, // Update followers count
      }));
    } catch (error) {
      console.error("Error toggling follow:", error.response || error.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (!profile) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <div className="mb-4 position-relative">
            <img
              src={previewImage || profile.profileimage} // Use the preview image if available
              alt="Profile"
              className="rounded-circle img-fluid"
              style={{ width: "150px", height: "150px", objectFit: "cover" }}
            />
            {editing && profile.isOwner && (
              <div className="mt-3">
                <label
                  htmlFor="profileImageInput"
                  className="btn btn-secondary"
                >
                  Choose Image
                </label>
                <input
                  id="profileImageInput"
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
          <div>
            {editing ? (
              <>
                <input
                  type="text"
                  name="profilename"
                  value={formData.profilename}
                  onChange={(e) =>
                    setFormData({ ...formData, profilename: e.target.value })
                  }
                  className="form-control mb-2"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="form-control"
                />
              </>
            ) : (
              <>
                <h2>{profile.profilename}</h2>
                <p>{profile.email}</p>
              </>
            )}
          </div>
          <div className="d-flex justify-content-between mt-3">
            <div>
              <h5>{profile.following_count}</h5>
              <span>Following</span>
            </div>
            <div>
              <h5>{profile.followers_count}</h5>
              <span>Followers</span>
            </div>
          </div>
          {!profile.isOwner && (
            <button
              className={`btn ${
                profile.is_following ? "btn-danger" : "btn-primary"
              } mt-3`}
              onClick={handleFollowToggle}
            >
              {profile.is_following ? "Unfollow" : "Follow"}
            </button>
          )}

          {profile.isOwner && (
            <div className="mt-4">
              {editing ? (
                <>
                  <button className="btn btn-success me-2" onClick={handleSave}>
                    Save
                  </button>
                  <button className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={handleEdit}>
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
