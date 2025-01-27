import React from "react";

function ProfileCard({ profile, onClick }) {
  return (
    <div
      className="d-flex align-items-center border p-3 rounded mb-2"
      style={{ cursor: "pointer" }}
      onClick={onClick} // Trigger navigation on click
    >
      {/* Profile Image */}
      <img
        src={profile.profileimage || "/default-avatar.png"}
        alt="Profile"
        className="rounded-circle me-3"
        style={{ width: "50px", height: "50px", objectFit: "cover" }}
      />

      {/* Profile Name */}
      <span className="ms-auto fw-bold">
        {profile.profilename || "Anonymous"}
      </span>
    </div>
  );
}

export default ProfileCard;
