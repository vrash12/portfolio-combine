import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/useAuth";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/projects", label: "Projects" },
  { to: "/blogs", label: "Blogs" },
  { to: "/about", label: "About" },
];

function getSessionId() {
  const existingSessionId = localStorage.getItem("portfolio_session_id");

  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId = crypto.randomUUID();

  localStorage.setItem("portfolio_session_id", newSessionId);

  return newSessionId;
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const isLoggedIn = Boolean(user);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  function trackNavClick(label: string, path: string) {
    api
      .post("/analytics/nav-click", {
        label,
        path,
        current_path: location.pathname,
        session_id: getSessionId(),
      })
      .catch((error) => {
        console.error("Failed to track nav click:", error);
      });
  }

  async function handleLogout() {
    trackNavClick("Logout", "/logout");

    await logout();

    setIsMenuOpen(false);
    navigate("/");
  }

  function navClass({ isActive }: { isActive: boolean }) {
    return isActive ? "nav-link active" : "nav-link";
  }

  return (
    <nav
      className="navbar neo-navbar"
      onKeyDown={(event) => {
        if (event.key === "Escape" && isMenuOpen) {
          setIsMenuOpen(false);
          menuToggleRef.current?.focus();
        }
      }}
    >
      <NavLink
        to="/"
        className="navbar-brand neo-brand"
        onClick={() => {
          trackNavClick("Logo", "/");
          setIsMenuOpen(false);
        }}
      >
        <div className="brand-logo-icon">
          <img
            src="/images/brand/space-logo.webp"
            alt="VRMS space logo"
            width="495"
            height="504"
            decoding="async"
          />
        </div>

        <div className="brand-wordmark">
          <img
            src="/images/brand/vrms-wordmark.webp"
            alt="VRMS"
            width="954"
            height="261"
            decoding="async"
          />
        </div>
      </NavLink>

      <button
        ref={menuToggleRef}
        type="button"
        className={isMenuOpen ? "nav-menu-toggle is-open" : "nav-menu-toggle"}
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
        aria-controls="primary-navigation"
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        id="primary-navigation"
        className={
          isMenuOpen
            ? "navbar-links neo-navbar-links is-open"
            : "navbar-links neo-navbar-links"
        }
      >
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={navClass}
            onClick={() => {
              trackNavClick(link.label, link.to);
              setIsMenuOpen(false);
            }}
          >
            {link.label}
          </NavLink>
        ))}
        <a
  href="/documents/Van_Rodolf_Suliva_Resume.pdf"
  target="_blank"
  rel="noreferrer"
  className="nav-link nav-resume"
  onClick={() => {
    trackNavClick("Resume", "/documents/Van_Rodolf_Suliva_Resume.pdf");
    setIsMenuOpen(false);
  }}
>
  Resume
</a>

        {isLoggedIn && (
          <>
            <NavLink
              to="/admin/projects"
              className={({ isActive }) =>
                isActive ? "nav-link nav-write active" : "nav-link nav-write"
              }
              onClick={() => {
                trackNavClick("Projects Admin", "/admin/projects");
                setIsMenuOpen(false);
              }}
            >
              Projects Admin
            </NavLink>

            <NavLink
              to="/admin/blogs"
              className={({ isActive }) =>
                isActive ? "nav-link nav-write active" : "nav-link nav-write"
              }
              onClick={() => {
                trackNavClick("Blogs Admin", "/admin/blogs");
                setIsMenuOpen(false);
              }}
            >
              Blogs Admin
            </NavLink>

            <button
              type="button"
              className="nav-button nav-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
