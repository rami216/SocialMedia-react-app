import React, { useEffect, useState, useRef } from "react";
import api from "../api";
import PostCard from "../components/PostCard";

function Home() {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState([]);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // This ref will be attached to the sentinel div at the bottom of the list
  const sentinelRef = useRef(null);

  // Fetch a page from `url` (or default if no url passed)
  const fetchPosts = async (url = "/api/posts/") => {
    try {
      setLoading(true);
      const response = await api.get(url);
      const { results, next } = response.data; // standard DRF pagination
      setPosts((prev) => {
        // Filter out any posts that already exist
        const newItems = results.filter(
          (incoming) => !prev.some((existing) => existing.id === incoming.id)
        );
        // Now combine
        return [...prev, ...newItems];
      });

      setNextPageUrl(next);
    } catch (error) {
      console.error("Error fetching posts:", error.response || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load of first page
  useEffect(() => {
    setPosts([]);
    setNextPageUrl(null);
    fetchPosts();
  }, []);

  // Intersection Observer setup
  useEffect(() => {
    // If no sentinel, or no next page, do nothing
    if (!sentinelRef.current || !nextPageUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading) {
          // If sentinel is in view, load next page
          fetchPosts(nextPageUrl);
        }
      },
      {
        root: null, // viewport
        rootMargin: "0px",
        threshold: 0.1, // trigger when 10% of sentinel is visible
      }
    );

    observer.observe(sentinelRef.current);

    // Cleanup on unmount or re-run
    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [nextPageUrl, loading]);

  // Toggle like, re-fetch or handle locally
  const toggleLike = async (postId) => {
    try {
      // 1) Patch on the backend
      await api.patch(`/api/posts/${postId}/`);

      // 2) Immediately update state so UI changes at once
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            const wasLiked = p.isLiked;
            const nowLiked = !wasLiked;
            return {
              ...p,
              isLiked: nowLiked,
              // Adjust likes_count
              likes_count: nowLiked ? p.likes_count + 1 : p.likes_count - 1,
            };
          }
          return p;
        })
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Delete a post from local state
  const onDelete = async (postId) => {
    try {
      await api.delete(`/api/posts/${postId}/`);
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId)
      );
    } catch (error) {
      console.error("Error deleting post:", error.response || error.message);
    }
  };

  // Create a post
  const handlePost = async () => {
    try {
      const response = await api.post("/api/posts/", { content });
      setMessage("Post created successfully!");
      setContent("");
      // Insert new post at the top
      setPosts((prevPosts) => [response.data, ...prevPosts]);

      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Error creating post:", error);
      setMessage("Failed to create the post. Please try again.");
      setTimeout(() => {
        setMessage("");
      }, 2000);
    }
  };

  return (
    <div className="container mt-5">
      {/* Create a Post */}
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Create a Post</h5>
              <textarea
                className="form-control mb-3"
                rows="4"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handlePost}>
                Post
              </button>
              {message && (
                <div className="mt-3 alert alert-info" role="alert">
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="row justify-content-center">
        <div className="col-md-8">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLikeToggle={toggleLike}
              onDelete={onDelete}
            />
          ))}

          {/* The sentinel div: the observer will watch this. */}
          {/* When it's visible and there's a `nextPageUrl`, fetch more posts. */}
          <div ref={sentinelRef} style={{ height: "40px" }} />

          {/* Loading indicator */}
          {loading && <p className="text-center my-3">Loading more posts...</p>}
        </div>
      </div>
    </div>
  );
}

export default Home;
