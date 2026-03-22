import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
  HiOutlineChartBarSquare,
  HiOutlineShieldCheck,
  HiOutlineDocumentChartBar,
  HiOutlineCog6Tooth,
  HiOutlineHomeModern,
  HiOutlineRocketLaunch,
  HiOutlineSignal,
  HiOutlineArrowRight,
  HiOutlinePlay,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { useAppSelector } from "../../store/hooks";
import "./Home.css";

/* ── Background slideshow images ── */
const HERO_IMAGES = [
  "/BackGroundImages/simone-hutsch-_wpce-AsLxk-unsplash.jpg",
  "/BackGroundImages/edoardo-busti-oza1V0kSiVQ-unsplash.jpg",
  "/BackGroundImages/simone-hutsch-eXBqaHUt994-unsplash.jpg",
  "/BackGroundImages/larissa-i6IHWq9qJRk-unsplash.jpg",
  "/BackGroundImages/simone-hutsch-kd10Eib3qsc-unsplash.jpg",
  "/BackGroundImages/simone-hutsch-l8fyK9RS-OU-unsplash.jpg",
  "/BackGroundImages/image.png",
  "/BackGroundImages/image copy.png",
];

const SLIDE_INTERVAL = 5000; // ms between slides

const features = [
  {
    icon: <HiOutlineBuildingOffice2 />,
    title: "Building Management",
    description:
      "Organize and manage all your buildings, towers, and societies with real-time tracking and updates.",
    image: "/BackGroundImages/simone-hutsch-eXBqaHUt994-unsplash.jpg",
  },
  {
    icon: <HiOutlineUserGroup />,
    title: "Flat & Tenant Tracking",
    description:
      "Keep track of flats, ownership details, tenant information, and occupancy status across buildings.",
    image: "/BackGroundImages/simone-hutsch-kd10Eib3qsc-unsplash.jpg",
  },
  {
    icon: <HiOutlineShieldCheck />,
    title: "Role-Based Access",
    description:
      "Secure Admin and User roles with JWT authentication ensuring the right people see the right data.",
    image: "/BackGroundImages/simone-hutsch-_wpce-AsLxk-unsplash.jpg",
  },
  {
    icon: <HiOutlineChartBarSquare />,
    title: "Analytics Dashboard",
    description:
      "Get insights with beautiful dashboards showing occupancy rates, collections, and project progress.",
    image: "/BackGroundImages/edoardo-busti-oza1V0kSiVQ-unsplash.jpg",
  },
  {
    icon: <HiOutlineDocumentChartBar />,
    title: "Reports & Exports",
    description:
      "Generate detailed reports for buildings, flats, and financials. Export to PDF or Excel with one click.",
    image: "/BackGroundImages/larissa-i6IHWq9qJRk-unsplash.jpg",
  },
  {
    icon: <HiOutlineCog6Tooth />,
    title: "Easy Configuration",
    description:
      "Flexible settings for building types, flat categories, pricing tiers, and notification preferences.",
    image: "/BackGroundImages/simone-hutsch-l8fyK9RS-OU-unsplash.jpg",
  },
];

const stats = [
  {
    icon: <HiOutlineBuildingOffice2 />,
    value: "500+",
    label: "Buildings Managed",
  },
  { icon: <HiOutlineHomeModern />, value: "12K+", label: "Flats Tracked" },
  { icon: <HiOutlineUserGroup />, value: "8K+", label: "Active Users" },
  { icon: <HiOutlineSignal />, value: "99.9%", label: "Uptime" },
];

const Home = () => {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { appName } = useAppSelector((s) => s.appSettings);

  /* ── Hero slideshow state ── */
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % HERO_IMAGES.length),
    [],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [next, paused]);

  /* ── Visible-on-scroll observer ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in-view");
        }),
      { threshold: 0.15 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-page">
      {/* ═══════════════════════════════════════════════════════
          HERO — Full-viewport image slideshow with crossfade
          ═══════════════════════════════════════════════════════ */}
      <section
        className="hero-slideshow"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Stacked images — only `active` one is visible */}
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className={`hero-slide ${i === current ? "active" : ""}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}

        {/* Dark cinematic overlay */}
        <div className="hero-overlay" />

        {/* Content */}
        <div className="hero-content">
          <span className="hero-eyebrow reveal in-view">
            <HiOutlineSparkles /> Premium Construction Platform
          </span>

          <h1 className="hero-title reveal in-view">
            Build the Future,
            <br />
            <span className="hero-accent">One Floor at a Time</span>
          </h1>

          <p className="hero-subtitle reveal in-view">
            The all-in-one platform for managing buildings, flats, and
            construction projects. Real-time 3D visualization, smart analytics,
            and seamless collaboration.
          </p>

          <div className="hero-buttons reveal in-view">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-hero-primary">
                Open Dashboard <HiOutlineArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-hero-primary">
                  Get Started Free <HiOutlineArrowRight />
                </Link>
                <Link to="/login" className="btn-hero-outline">
                  <HiOutlinePlay /> Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Slide indicators */}
        <div className="hero-dots">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={`dot-${i}`}
              className={`hero-dot ${i === current ? "active" : ""}`}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Scroll prompt */}
        <div className="hero-scroll-hint">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STATS BAR — Floating glassmorphism ribbon
          ═══════════════════════════════════════════════════════ */}
      <section className="stats-ribbon reveal">
        <div className="stats-ribbon-inner">
          {stats.map((stat) => (
            <div className="stat-pill" key={stat.label}>
              <span className="stat-pill-icon">{stat.icon}</span>
              <div>
                <div className="stat-pill-value">{stat.value}</div>
                <div className="stat-pill-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES — Cards with image peek on hover
          ═══════════════════════════════════════════════════════ */}
      <section className="features-section" id="features">
        <div className="section-header reveal">
          <span className="section-eyebrow">
            <HiOutlineRocketLaunch /> Features
          </span>
          <h2>Everything You Need to Excel</h2>
          <p>
            Powerful tools to manage your entire construction and building
            operations from one unified platform.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div
              className="feature-card reveal"
              key={f.title}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              {/* Background image peek */}
              <div
                className="feature-card-bg"
                style={{ backgroundImage: `url(${f.image})` }}
              />
              <div className="feature-card-body">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SHOWCASE — Full-width parallax image band
          ═══════════════════════════════════════════════════════ */}
      <section
        className="showcase-band"
        style={{
          backgroundImage:
            "url(/BackGroundImages/simone-hutsch-_wpce-AsLxk-unsplash.jpg)",
        }}
      >
        <div className="showcase-overlay" />
        <div className="showcase-content reveal">
          <h2>Visualize Your Buildings in Stunning 3D</h2>
          <p>
            Our parametric viewer renders every floor, flat, corridor, and
            staircase — with glass materials, real-time shadows, and interactive
            exploration.
          </p>
          <Link
            to={isAuthenticated ? "/buildings" : "/register"}
            className="btn-hero-primary"
          >
            Explore Now <HiOutlineArrowRight />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA — Clean closing section with image background
          ═══════════════════════════════════════════════════════ */}
      <section
        className="cta-section"
        style={{
          backgroundImage:
            "url(/BackGroundImages/edoardo-busti-oza1V0kSiVQ-unsplash.jpg)",
        }}
      >
        <div className="cta-overlay" />
        <div className="cta-content reveal">
          <span className="cta-eyebrow">Ready to Transform?</span>
          <h2>
            Start Managing Smarter, <span className="hero-accent">Today</span>
          </h2>
          <p>
            Join thousands of construction professionals who trust {appName}
            to manage their projects.
          </p>
          <div className="cta-buttons">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-hero-primary">
                Open Dashboard <HiOutlineArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-hero-primary">
                  Create Free Account <HiOutlineArrowRight />
                </Link>
                <Link to="/login" className="btn-hero-outline light">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
