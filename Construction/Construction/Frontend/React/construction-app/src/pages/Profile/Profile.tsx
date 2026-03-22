import { useAppSelector } from "../../store/hooks";
import "./Profile.css";

const Profile = () => {
  const { user } = useAppSelector((s) => s.auth);

  return (
    <div className="profile-page fade-in">
      <div className="profile-inner">
        <div className="profile-card">
          <div className="profile-avatar">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <h1>{user?.username || "User"}</h1>
          <span className={`profile-role ${user?.role?.toLowerCase()}`}>
            {user?.role === "Admin" ? "🛡️" : "👤"} {user?.role}
          </span>

          <div className="profile-details">
            <div className="profile-row">
              <span className="profile-row-label">User ID</span>
              <span className="profile-row-value">{user?.userId || "—"}</span>
            </div>
            <div className="profile-row">
              <span className="profile-row-label">Username</span>
              <span className="profile-row-value">{user?.username}</span>
            </div>
            <div className="profile-row">
              <span className="profile-row-label">Role</span>
              <span className="profile-row-value">{user?.role}</span>
            </div>
            <div className="profile-row">
              <span className="profile-row-label">Status</span>
              <span
                className="profile-row-value"
                style={{ color: "var(--color-success)" }}
              >
                ● Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
