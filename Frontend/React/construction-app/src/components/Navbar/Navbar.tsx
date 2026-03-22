import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineBars3,
  HiXMark,
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
  HiOutlineHome,
  HiOutlineSquares2X2,
  HiOutlineShieldCheck,
  HiOutlineBuildingOffice2,
  HiOutlineHomeModern,
  HiOutlineCubeTransparent,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { toggleTheme } from "../../store/slices/themeSlice";
import { logout } from "../../store/slices/authSlice";
import HirojiLogo from "../Logo/HirojiLogo";
import toast from "react-hot-toast";
import "./Navbar.css";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { mode } = useAppSelector((s) => s.theme);
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const { appName } = useAppSelector((s) => s.appSettings);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <HirojiLogo height={26} showText={false} />
          <span>{appName}</span>
        </Link>

        {/* Nav Links */}
        <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <li>
            <NavLink to="/" onClick={() => setMenuOpen(false)}>
              <HiOutlineHome /> Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)}>
              <HiOutlineEnvelope /> Contact
            </NavLink>
          </li>
          <li>
            <NavLink to="/projects" onClick={() => setMenuOpen(false)}>
              <HiOutlinePhoto /> Projects
            </NavLink>
          </li>
          {isAuthenticated && (
            <li>
              <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
                <HiOutlineSquares2X2 /> Dashboard
              </NavLink>
            </li>
          )}
          {isAuthenticated && (
            <li>
              <NavLink to="/buildings" onClick={() => setMenuOpen(false)}>
                <HiOutlineBuildingOffice2 /> Buildings
              </NavLink>
            </li>
          )}
          {isAuthenticated && (
            <li>
              <NavLink to="/flats" onClick={() => setMenuOpen(false)}>
                <HiOutlineHomeModern /> Flats
              </NavLink>
            </li>
          )}
          {isAuthenticated && (
            <li>
              <NavLink to="/viewer" onClick={() => setMenuOpen(false)}>
                <HiOutlineCubeTransparent /> 3D Viewer
              </NavLink>
            </li>
          )}
          {isAuthenticated && (
            <li>
              <NavLink to="/map" onClick={() => setMenuOpen(false)}>
                <HiOutlineGlobeAlt /> Map
              </NavLink>
            </li>
          )}
          {isAuthenticated && user?.role === "Admin" && (
            <li>
              <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
                <HiOutlineShieldCheck /> Admin Panel
              </NavLink>
            </li>
          )}
        </ul>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={() => dispatch(toggleTheme())}
            aria-label="Toggle theme"
          >
            {mode === "light" ? <HiOutlineMoon /> : <HiOutlineSun />}
          </button>

          {isAuthenticated && user ? (
            /* User Menu */
            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="user-menu-name">{user.username}</div>
                  <div className="user-menu-role">{user.role}</div>
                </div>
              </button>

              {dropdownOpen && (
                <div className="user-menu-dropdown">
                  <Link to="/dashboard" onClick={() => setDropdownOpen(false)}>
                    <HiOutlineSquares2X2 /> Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                    <HiOutlineUser /> Profile
                  </Link>
                  <div className="user-menu-divider" />
                  <button className="logout-btn" onClick={handleLogout}>
                    <HiOutlineArrowRightOnRectangle /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Auth Buttons */
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <HiXMark /> : <HiOutlineBars3 />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
