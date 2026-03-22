import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineBuildingOffice2,
  HiOutlineHomeModern,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePlusCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineBell,
  HiOutlineRocketLaunch,
} from "react-icons/hi2";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { fetchCurrentUser } from "../../store/slices/authSlice";
import { fetchBuildings } from "../../store/slices/buildingSlice";
import { fetchFlats } from "../../store/slices/flatSlice";
import "./Dashboard.css";

const quickActions = [
  {
    icon: <HiOutlinePlusCircle />,
    title: "Add Building",
    desc: "Register a new building",
    path: "/buildings",
  },
  {
    icon: <HiOutlineHomeModern />,
    title: "Add Flat",
    desc: "Add flat to a building",
    path: "/flats",
  },
  {
    icon: <HiOutlineClipboardDocumentList />,
    title: "All Flats",
    desc: "View all flats",
    path: "/flats",
  },
  {
    icon: <HiOutlineCog6Tooth />,
    title: "Profile",
    desc: "Manage your profile",
    path: "/profile",
  },
];

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { buildings } = useAppSelector((s) => s.buildings);
  const { flats } = useAppSelector((s) => s.flats);

  const availableFlats = flats.filter((f) => f.isAvailable).length;
  const occupiedFlats = flats.filter((f) => !f.isAvailable).length;

  useEffect(() => {
    dispatch(fetchCurrentUser());
    dispatch(fetchBuildings());
    dispatch(fetchFlats());
  }, [dispatch]);

  const stats = [
    {
      icon: <HiOutlineBuildingOffice2 />,
      value: buildings.length.toString(),
      label: "Total Buildings",
    },
    {
      icon: <HiOutlineHomeModern />,
      value: flats.length.toString(),
      label: "Total Flats",
    },
    {
      icon: <HiOutlineCheckCircle />,
      value: availableFlats.toString(),
      label: "Available Flats",
    },
    {
      icon: <HiOutlineXCircle />,
      value: occupiedFlats.toString(),
      label: "Occupied Flats",
    },
  ];

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-inner">
        {/* ─── Welcome ─── */}
        <div className="dashboard-welcome">
          <h1>
            Welcome back, {user?.username || "User"}
            <span className={`role-badge ${user?.role?.toLowerCase()}`}>
              {user?.role === "Admin" ? "🛡️" : "👤"} {user?.role}
            </span>
          </h1>
          <p>Here's what's happening with your construction projects today.</p>
        </div>

        {/* ─── Stats ─── */}
        <div className="dashboard-stats">
          {stats.map((stat) => (
            <div className="stat-card slide-up" key={stat.label}>
              <div className="stat-header">
                <div className="stat-icon">{stat.icon}</div>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ─── Grid: Quick Actions + Summary ─── */}
        <div className="dashboard-grid">
          <div className="quick-actions-card">
            <div className="card-title">
              <HiOutlineRocketLaunch /> Quick Actions
            </div>
            <div className="actions-grid">
              {quickActions.map((action) => (
                <div
                  className="action-item"
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="action-icon">{action.icon}</div>
                  <div>
                    <h4>{action.title}</h4>
                    <p>{action.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <div className="card-title">
              <HiOutlineBell /> Buildings Overview
            </div>
            <div className="activity-list">
              {buildings.length > 0 ? (
                buildings.slice(0, 5).map((b) => (
                  <div
                    className="activity-item"
                    key={b.id}
                    onClick={() => navigate(`/buildings/${b.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="activity-dot blue" />
                    <div>
                      <div className="activity-text">{b.name}</div>
                      <div className="activity-time">
                        {b.city} — {b.flatCount} flat
                        {b.flatCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  No buildings yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
