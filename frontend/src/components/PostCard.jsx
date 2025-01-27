import React, { useState } from "react";
import api from "../api";

function PostCard({ post, onLikeToggle, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

  const handleEditClick = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditedContent(post.content);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/api/posts/${post.id}/`, { content: editedContent });
      post.content = editedContent;
      setEditing(false);
    } catch (error) {
      console.error("Error updating post:", error.response || error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/posts/${post.id}/`);

      onDelete(post.id);
    } catch (error) {
      console.error("Error deleting post:", error.response || error.message);
    }
  };

  return (
    <div className={`card my-3 ${editing ? "border border-dark" : ""}`}>
      <div className="card-body">
        {/* Row for profile image, username, and edit/delete icons */}
        <div className="d-flex align-items-center">
          {post.owner_profile_image ? (
            <img
              src={`http://127.0.0.1:8000${post.owner_profile_image}`}
              alt="Owner"
              className="rounded-circle"
              style={{ width: "60px", height: "60px", objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded-circle bg-secondary d-flex justify-content-center align-items-center"
              style={{ width: "60px", height: "60px" }}
            >
              <span className="text-white">No Img</span>
            </div>
          )}

          <div className="ms-3">
            <h6 className="mb-0">{post.owner_username}</h6>
          </div>

          {post.isOwner && (
            <div className="ms-auto">
              {!editing && (
                <>
                  <i
                    className="fa fa-pen text-muted me-3"
                    style={{ cursor: "pointer" }}
                    onClick={handleEditClick}
                  />
                  <i
                    className="fa fa-trash text-danger"
                    style={{ cursor: "pointer" }}
                    onClick={() => onDelete(post.id)}
                  />
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-3">
          {editing ? (
            <>
              <textarea
                className="form-control"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={3}
              />
              <div className="mt-2">
                <button
                  className="btn btn-sm btn-success me-2"
                  onClick={handleSaveEdit}
                >
                  Save
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p>{post.content}</p>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <i
            className={`fa-heart ${post.isLiked ? "fas" : "far"}`}
            style={{
              fontSize: "24px",
              color: post.isLiked ? "red" : "gray",
              cursor: "pointer",
            }}
            onClick={() => onLikeToggle(post.id)}
          ></i>
          <span>
            {post.likes_count} {post.likes_count === 1 ? "like" : "likes"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PostCard;
