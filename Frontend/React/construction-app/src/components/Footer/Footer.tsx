import { Link } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import HirojiLogo from "../Logo/HirojiLogo";
import "./Footer.css";

const Footer = () => {
  const { appName } = useAppSelector((s) => s.appSettings);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>
              <HirojiLogo height={24} showText={false} />
              <span style={{ verticalAlign: "middle", marginLeft: 8 }}>
                {appName}
              </span>
            </h3>
            <p>
              Modern building & flat management platform. Streamline your
              construction projects, manage buildings, and track everything in
              one place.
            </p>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/login">Sign In</Link>
              </li>
              <li>
                <Link to="/register">Sign Up</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Features</h4>
            <ul>
              <li>
                <a href="#features">Building Management</a>
              </li>
              <li>
                <a href="#features">Flat Tracking</a>
              </li>
              <li>
                <a href="#features">Role-Based Access</a>
              </li>
              <li>
                <a href="#features">Reports & Analytics</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li>
                <Link to="/contact">Contact Us</Link>
              </li>
              <li>
                <a href="#docs">Documentation</a>
              </li>
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {appName}. All rights reserved.
          </span>
          <span>Built with React & .NET</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
