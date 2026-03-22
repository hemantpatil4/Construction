import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { useAppSelector } from "../../store/hooks";
import HirojiLogo from "../../components/Logo/HirojiLogo";
import "./Contact.css";

const Contact = () => {
  const { appName } = useAppSelector((s) => s.appSettings);
  const { mode } = useAppSelector((s) => s.theme);

  return (
    <div className={`contact-page ${mode}`}>
      {/* ─── Hero ─── */}
      <section className="contact-hero">
        <div className="hero-bg-pattern" />
        <div className="hero-content">
          <div className="hero-badge">
            <HiOutlineSparkles /> Contact
          </div>
          <h1>Get In Touch</h1>
          <p>
            Have a question or need assistance? We're here to help you with all
            your construction management needs.
          </p>
        </div>
      </section>

      {/* ─── Contact Cards ─── */}
      <section className="contact-cards-section">
        <div className="contact-cards-grid">
          <div className="contact-card">
            <div className="contact-card-icon blue">
              <HiOutlinePhone />
            </div>
            <h3>Call Us</h3>
            <p className="contact-card-detail">
              <a href="tel:+919075952987">+91 90759 52987</a>
            </p>
            <p className="contact-card-detail">
              <a href="tel:+919420485987">+91 94204 85987</a>
            </p>
            <span className="contact-card-note">Mon – Sat, 9 AM – 7 PM</span>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon green">
              <HiOutlineEnvelope />
            </div>
            <h3>Email Us</h3>
            <p className="contact-card-detail">
              <a href="mailto:hemanttusharpatil@gmail.com">
                hemanttusharpatil@gmail.com
              </a>
            </p>
            <span className="contact-card-note">
              We respond within 24 hours
            </span>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon purple">
              <HiOutlineMapPin />
            </div>
            <h3>Visit Us</h3>
            <p className="contact-card-detail">Pune, Maharashtra</p>
            <p className="contact-card-detail">India — 411038</p>
            <span className="contact-card-note">By appointment only</span>
          </div>
        </div>
      </section>

      {/* ─── Office Info ─── */}
      <section className="contact-office-section">
        <div className="contact-office-card">
          <div className="contact-office-left">
            <div className="contact-office-icon">
              <HirojiLogo height={30} showText={false} />
            </div>
            <div>
              <h2>{appName}</h2>
              <p>Modern Construction & Building Management Solutions</p>
            </div>
          </div>

          <div className="contact-office-divider" />

          <div className="contact-office-hours">
            <h4>
              <HiOutlineClock /> Office Hours
            </h4>
            <div className="contact-hours-list">
              <div className="contact-hours-row">
                <span className="contact-hours-day">Monday – Friday</span>
                <span className="contact-hours-time">9:00 AM – 7:00 PM</span>
              </div>
              <div className="contact-hours-row">
                <span className="contact-hours-day">Saturday</span>
                <span className="contact-hours-time">10:00 AM – 4:00 PM</span>
              </div>
              <div className="contact-hours-row closed">
                <span className="contact-hours-day">Sunday</span>
                <span className="contact-hours-time">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
