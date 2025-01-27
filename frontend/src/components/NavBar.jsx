import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import ProfileCard from "./ProfileCard";

function NavBar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setIsLoggedIn(false);
    navigate("/login");
  };
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query) {
      try {
        const response = await api.get(`/api/profile/?search=${query}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          {/* Brand logo */}
          <a className="navbar-brand" onClick={() => navigate("/")}>
            Active Listings
          </a>

          {/* Toggler button for mobile */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navbar content */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto me-auto">
              {/* Centered Search Form (wrapped in a position-relative container) */}
              {isLoggedIn && (
                <div
                  className="mx-auto position-relative"
                  style={{ width: "300px" }}
                >
                  {/* The input is inside this position-relative container */}
                  <input
                    className="form-control"
                    type="search"
                    placeholder="Search"
                    aria-label="Search"
                    onChange={handleSearch}
                    value={searchQuery}
                  />

                  {/* Results as an absolutely positioned dropdown */}
                  {searchResults.length > 0 && (
                    <div
                      className="list-group"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      {searchResults.map((profile) => (
                        <div
                          key={profile.id}
                          className="list-group-item"
                          onClick={() => {
                            navigate(`/profile/${profile.id}`);
                            setSearchResults([]);
                            setSearchQuery("");
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <ProfileCard profile={profile} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ul>
            <ul className="navbar-nav ms-auto">
              {/* Login/Register or Profile/Logout */}
              {!isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <a className="nav-link" onClick={() => navigate("/login")}>
                      Login
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className="nav-link"
                      onClick={() => navigate("/register")}
                    >
                      Register
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <a
                      className="nav-link"
                      onClick={() => navigate("/profile")}
                    >
                      My Profile
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" onClick={handleLogout}>
                      Logout
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

export default NavBar;
