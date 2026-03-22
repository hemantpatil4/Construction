import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineBuildingOffice2,
  HiOutlineHomeModern,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
  HiOutlineChartBarSquare,
  HiOutlineCog6Tooth,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiOutlineCloudArrowUp,
} from "react-icons/hi2";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchBuildings } from "../../store/slices/buildingSlice";
import { fetchFlats } from "../../store/slices/flatSlice";
import {
  fetchUsers,
  updateUserRole,
  deleteUser,
} from "../../store/slices/usersSlice";
import { updateSetting } from "../../store/slices/appSettingsSlice";
import {
  fetchSections,
  fetchAllPhotos,
  createSection,
  updateSection,
  deleteSection,
  createPhoto,
  updatePhoto,
  deletePhoto,
} from "../../store/slices/gallerySlice";
import { authService } from "../../services/auth.service";
import type { UserRead } from "../../types/auth.types";
import type {
  GallerySectionRead,
  GalleryPhotoRead,
  CreateGallerySection,
  UpdateGallerySection,
  CreateGalleryPhoto,
  UpdateGalleryPhoto,
} from "../../types/gallery.types";
import Modal from "../../components/Modal/Modal";
import toast from "react-hot-toast";
import "./Admin.css";

type AdminTab = "overview" | "users" | "settings" | "gallery";

const AdminPanel = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { buildings } = useAppSelector((s) => s.buildings);
  const { flats } = useAppSelector((s) => s.flats);
  const { users, loading: usersLoading } = useAppSelector((s) => s.users);
  const { appName } = useAppSelector((s) => s.appSettings);
  const {
    sections,
    photos,
    loading: galleryLoading,
  } = useAppSelector((s) => s.gallery);

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editedAppName, setEditedAppName] = useState(appName);

  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRead | null>(null);
  const [newRole, setNewRole] = useState<"Admin" | "User">("User");

  // Gallery State
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);
  const [editingSection, setEditingSection] =
    useState<GallerySectionRead | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhotoRead | null>(
    null,
  );
  const [sectionForm, setSectionForm] = useState<CreateGallerySection>({
    name: "",
    description: "",
    displayOrder: 0,
    isActive: true,
  });
  const [photoForm, setPhotoForm] = useState<CreateGalleryPhoto>({
    title: "",
    description: "",
    imageUrl: "",
    thumbnailUrl: "",
    displayOrder: 0,
    isActive: true,
    sectionId: 0,
    buildingId: null,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Process file (used by both upload and drag/drop)
  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoForm((prev) => ({ ...prev, imageUrl: base64 }));
      setUploadingImage(false);
      toast.success("Image uploaded successfully!");
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // File input handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Fetch all data on mount
  useEffect(() => {
    dispatch(fetchBuildings());
    dispatch(fetchFlats());
    dispatch(fetchUsers());
    dispatch(fetchSections(true)); // Include inactive
    dispatch(fetchAllPhotos(true));

    const testAdmin = async () => {
      try {
        const data = await authService.adminOnly();
        setServerMessage(data.message);
      } catch {
        setServerMessage(null);
      }
    };
    testAdmin();
  }, [dispatch]);

  // Computed stats
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "Admin").length;
  const userCount = users.filter((u) => u.role === "User").length;
  const totalBuildings = buildings.length;
  const totalFlats = flats.length;
  const availableFlats = flats.filter((f) => f.isAvailable).length;
  const occupiedFlats = flats.filter((f) => !f.isAvailable).length;

  const stats = [
    { icon: <HiOutlineUserGroup />, value: totalUsers, label: "Total Users" },
    {
      icon: <HiOutlineBuildingOffice2 />,
      value: totalBuildings,
      label: "Buildings",
    },
    { icon: <HiOutlineHomeModern />, value: totalFlats, label: "Total Flats" },
    {
      icon: <HiOutlineCheckCircle />,
      value: availableFlats,
      label: "Available",
    },
    { icon: <HiOutlineXCircle />, value: occupiedFlats, label: "Occupied" },
  ];

  // Filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ─── Role Update ───
  const handleRoleOpen = (u: UserRead) => {
    setSelectedUser(u);
    setNewRole(u.role === "Admin" ? "User" : "Admin");
    setShowRoleModal(true);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;
    const result = await dispatch(
      updateUserRole({ id: selectedUser.id, data: { role: newRole } }),
    );
    if (updateUserRole.fulfilled.match(result)) {
      toast.success(`${selectedUser.username} role updated to ${newRole}`);
      setShowRoleModal(false);
      setSelectedUser(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  // ─── Delete User ───
  const handleDeleteOpen = (u: UserRead) => {
    setSelectedUser(u);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const result = await dispatch(deleteUser(selectedUser.id));
    if (deleteUser.fulfilled.match(result)) {
      toast.success(`${selectedUser.username} deleted`);
      setShowDeleteModal(false);
      setSelectedUser(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  // ─── Gallery Handlers ───
  const openSectionModal = (section?: GallerySectionRead) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({
        name: section.name,
        description: section.description || "",
        displayOrder: section.displayOrder,
        isActive: section.isActive,
      });
    } else {
      setEditingSection(null);
      setSectionForm({
        name: "",
        description: "",
        displayOrder: sections.length,
        isActive: true,
      });
    }
    setShowSectionModal(true);
  };

  const handleSaveSection = async () => {
    if (!sectionForm.name.trim()) {
      toast.error("Section name is required");
      return;
    }
    if (editingSection) {
      const result = await dispatch(
        updateSection({
          id: editingSection.id,
          data: sectionForm as UpdateGallerySection,
        }),
      );
      if (updateSection.fulfilled.match(result)) {
        toast.success("Section updated");
        setShowSectionModal(false);
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(createSection(sectionForm));
      if (createSection.fulfilled.match(result)) {
        toast.success("Section created");
        setShowSectionModal(false);
      } else {
        toast.error(result.payload as string);
      }
    }
  };

  const handleDeleteSection = async () => {
    if (!editingSection) return;
    const result = await dispatch(deleteSection(editingSection.id));
    if (deleteSection.fulfilled.match(result)) {
      toast.success("Section deleted");
      setShowDeleteSectionModal(false);
      setEditingSection(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const openPhotoModal = (photo?: GalleryPhotoRead) => {
    if (photo) {
      setEditingPhoto(photo);
      setPhotoForm({
        title: photo.title || "",
        description: photo.description || "",
        imageUrl: photo.imageUrl,
        thumbnailUrl: photo.thumbnailUrl || "",
        displayOrder: photo.displayOrder,
        isActive: photo.isActive,
        sectionId: photo.sectionId,
        buildingId: photo.buildingId,
      });
    } else {
      setEditingPhoto(null);
      setPhotoForm({
        title: "",
        description: "",
        imageUrl: "",
        thumbnailUrl: "",
        displayOrder: photos.length,
        isActive: true,
        sectionId: sections.length > 0 ? sections[0].id : 0,
        buildingId: null,
      });
    }
    setShowPhotoModal(true);
  };

  const handleSavePhoto = async () => {
    if (!photoForm.imageUrl.trim()) {
      toast.error("Image URL is required");
      return;
    }
    if (!photoForm.sectionId) {
      toast.error("Please select a section");
      return;
    }
    if (editingPhoto) {
      const result = await dispatch(
        updatePhoto({
          id: editingPhoto.id,
          data: photoForm as UpdateGalleryPhoto,
        }),
      );
      if (updatePhoto.fulfilled.match(result)) {
        toast.success("Photo updated");
        setShowPhotoModal(false);
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(createPhoto(photoForm));
      if (createPhoto.fulfilled.match(result)) {
        toast.success("Photo added");
        setShowPhotoModal(false);
      } else {
        toast.error(result.payload as string);
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!editingPhoto) return;
    const result = await dispatch(deletePhoto(editingPhoto.id));
    if (deletePhoto.fulfilled.match(result)) {
      toast.success("Photo deleted");
      setShowDeletePhotoModal(false);
      setEditingPhoto(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  return (
    <div className="admin-panel fade-in">
      <div className="admin-inner">
        {/* ─── Header ─── */}
        <div className="admin-header">
          <h1>
            <HiOutlineShieldCheck /> Admin Panel
          </h1>
          <p>
            Manage users, buildings, and system settings. Logged in as{" "}
            <strong>{user?.username}</strong>.
          </p>
        </div>

        {/* Server health */}
        {serverMessage && (
          <div className="server-message">
            <HiOutlineCheckCircle /> Server: {serverMessage}
          </div>
        )}

        {/* ─── Stats ─── */}
        <div className="admin-stats">
          {stats.map((s) => (
            <div className="admin-stat-card slide-up" key={s.label}>
              <div className="admin-stat-icon">{s.icon}</div>
              <div className="admin-stat-value">{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ─── Tabs ─── */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <HiOutlineChartBarSquare /> Overview
          </button>
          <button
            className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <HiOutlineUserGroup /> Users{" "}
            <span className="tab-count">{totalUsers}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <HiOutlineCog6Tooth /> Settings
          </button>
          <button
            className={`admin-tab ${activeTab === "gallery" ? "active" : ""}`}
            onClick={() => setActiveTab("gallery")}
          >
            <HiOutlinePhoto /> Gallery{" "}
            <span className="tab-count">{photos.length}</span>
          </button>
        </div>

        {/* ─── Tab Content ─── */}
        {activeTab === "overview" && (
          <div className="overview-grid fade-in">
            {/* Buildings quick look */}
            <div className="overview-card">
              <h3>
                <HiOutlineBuildingOffice2 /> Recent Buildings
              </h3>
              <div className="overview-list">
                {buildings.length > 0 ? (
                  buildings.slice(0, 5).map((b) => (
                    <div
                      className="overview-item"
                      key={b.id}
                      onClick={() => navigate(`/buildings/${b.id}`)}
                    >
                      <div className="overview-item-icon">
                        <HiOutlineBuildingOffice2 />
                      </div>
                      <div>
                        <h4>{b.name}</h4>
                        <p>
                          {b.city} — {b.flatCount} flat
                          {b.flatCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p
                    style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}
                  >
                    No buildings yet.
                  </p>
                )}
              </div>
            </div>

            {/* Users quick look */}
            <div className="overview-card">
              <h3>
                <HiOutlineUserGroup /> Recent Users
              </h3>
              <div className="overview-list">
                {users.length > 0 ? (
                  users.slice(0, 5).map((u) => (
                    <div
                      className="overview-item"
                      key={u.id}
                      onClick={() => setActiveTab("users")}
                    >
                      <div className="overview-item-icon">
                        {u.role === "Admin" ? "🛡️" : "👤"}
                      </div>
                      <div>
                        <h4>{u.username}</h4>
                        <p>
                          {u.email} — {u.role}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p
                    style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}
                  >
                    No users yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="fade-in">
            <div className="users-section-header">
              <h2>
                <HiOutlineUserGroup /> All Users ({totalUsers})
              </h2>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <HiOutlineMagnifyingGlass
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  className="user-search-input"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="page-loader">
                <div className="spinner spinner-lg" />
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-info-cell">
                            <div className="user-avatar-sm">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="username">{u.username}</div>
                              <div className="email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`role-badge-table ${u.role.toLowerCase()}`}
                          >
                            {u.role === "Admin" ? "🛡️" : "👤"} {u.role}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              onClick={() => handleRoleOpen(u)}
                              title="Change Role"
                            >
                              <HiOutlinePencilSquare />
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteOpen(u)}
                              title="Delete User"
                            >
                              <HiOutlineTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>No Users Found</h3>
                <p>
                  {searchQuery
                    ? "No users match your search."
                    : "No users registered yet."}
                </p>
              </div>
            )}

            {/* User Summary */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div
                className="admin-stat-card"
                style={{ flex: 1, minWidth: 140 }}
              >
                <div className="admin-stat-value" style={{ color: "#ef4444" }}>
                  {adminCount}
                </div>
                <div className="admin-stat-label">Admins</div>
              </div>
              <div
                className="admin-stat-card"
                style={{ flex: 1, minWidth: 140 }}
              >
                <div className="admin-stat-value" style={{ color: "#10b981" }}>
                  {userCount}
                </div>
                <div className="admin-stat-label">Regular Users</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="fade-in">
            <div className="overview-grid">
              {/* ─── App Name Setting ─── */}
              <div className="overview-card">
                <h3>
                  <HiOutlineCog6Tooth /> Application Settings
                </h3>
                <div style={{ marginTop: "1rem" }}>
                  <div className="form-group">
                    <label
                      className="form-label"
                      style={{ fontWeight: 700, marginBottom: 6 }}
                    >
                      Application Name
                    </label>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        marginBottom: 10,
                      }}
                    >
                      This name appears in the navbar, footer, login, register,
                      and all pages across the app.
                    </p>
                    <input
                      className="user-search-input"
                      style={{ width: "100%", marginBottom: 12 }}
                      placeholder="Enter app name..."
                      value={editedAppName}
                      onChange={(e) => setEditedAppName(e.target.value)}
                      maxLength={40}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          if (!editedAppName.trim()) {
                            toast.error("App name cannot be empty");
                            return;
                          }
                          try {
                            await dispatch(
                              updateSetting({
                                key: "AppName",
                                value: editedAppName.trim(),
                              }),
                            ).unwrap();
                            toast.success(
                              `App name updated to "${editedAppName.trim()}"`,
                            );
                          } catch (err: unknown) {
                            toast.error(
                              typeof err === "string"
                                ? err
                                : "Failed to update app name",
                            );
                          }
                        }}
                        disabled={editedAppName.trim() === appName}
                      >
                        Save Name
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          setEditedAppName(appName);
                        }}
                        disabled={editedAppName === appName}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  {editedAppName.trim() !== appName && (
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--color-primary)",
                        marginTop: 10,
                        fontWeight: 600,
                      }}
                    >
                      Preview:{" "}
                      <strong>{editedAppName.trim() || "ConstructPro"}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* ─── Current Settings Summary ─── */}
              <div className="overview-card">
                <h3>
                  <HiOutlineChartBarSquare /> Current Configuration
                </h3>
                <div className="overview-list" style={{ marginTop: "1rem" }}>
                  <div className="overview-item">
                    <div className="overview-item-icon">🏷️</div>
                    <div>
                      <h4>App Name</h4>
                      <p>{appName}</p>
                    </div>
                  </div>
                  <div className="overview-item">
                    <div className="overview-item-icon">👥</div>
                    <div>
                      <h4>Total Users</h4>
                      <p>
                        {totalUsers} users ({adminCount} admins, {userCount}{" "}
                        regular)
                      </p>
                    </div>
                  </div>
                  <div className="overview-item">
                    <div className="overview-item-icon">🏢</div>
                    <div>
                      <h4>Buildings</h4>
                      <p>
                        {totalBuildings} buildings, {totalFlats} flats
                      </p>
                    </div>
                  </div>
                  <div className="overview-item">
                    <div className="overview-item-icon">🔐</div>
                    <div>
                      <h4>Logged In As</h4>
                      <p>
                        {user?.username} ({user?.role})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            GALLERY TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === "gallery" && (
          <div className="fade-in">
            <div className="gallery-admin-header">
              <h2>
                <HiOutlinePhoto /> Gallery Management
              </h2>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => openSectionModal()}
                >
                  <HiOutlinePlus /> New Section
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => openPhotoModal()}
                  disabled={sections.length === 0}
                >
                  <HiOutlinePlus /> Add Photo
                </button>
              </div>
            </div>

            {galleryLoading ? (
              <div className="page-loader">
                <div className="spinner spinner-lg" />
              </div>
            ) : (
              <div className="gallery-admin-content">
                {/* Sections Overview */}
                <div
                  className="overview-card"
                  style={{ marginBottom: "1.5rem" }}
                >
                  <h3>📁 Sections ({sections.length})</h3>
                  {sections.length === 0 ? (
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.88rem",
                        marginTop: "1rem",
                      }}
                    >
                      No sections yet. Create your first section to organize
                      photos.
                    </p>
                  ) : (
                    <div className="sections-admin-grid">
                      {sections.map((section) => (
                        <div key={section.id} className="section-admin-item">
                          <div className="section-admin-info">
                            <h4>{section.name}</h4>
                            <p>{section.description || "No description"}</p>
                            <span className="section-meta">
                              {section.photoCount} photos · Order:{" "}
                              {section.displayOrder}
                              {!section.isActive && (
                                <span className="badge-inactive">
                                  {" "}
                                  · Inactive
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="section-admin-actions">
                            <button
                              onClick={() => openSectionModal(section)}
                              title="Edit"
                            >
                              <HiOutlinePencilSquare />
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => {
                                setEditingSection(section);
                                setShowDeleteSectionModal(true);
                              }}
                              title="Delete"
                            >
                              <HiOutlineTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Photos Overview */}
                <div className="overview-card">
                  <h3>🖼️ All Photos ({photos.length})</h3>
                  {photos.length === 0 ? (
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.88rem",
                        marginTop: "1rem",
                      }}
                    >
                      No photos yet. Add photos to your gallery sections.
                    </p>
                  ) : (
                    <div className="photos-admin-grid">
                      {photos.map((photo) => (
                        <div key={photo.id} className="photo-admin-item">
                          <div className="photo-admin-thumb">
                            <img
                              src={photo.thumbnailUrl || photo.imageUrl}
                              alt={photo.title || "Photo"}
                            />
                            {!photo.isActive && (
                              <div className="photo-inactive-badge">
                                Inactive
                              </div>
                            )}
                          </div>
                          <div className="photo-admin-info">
                            <h4>{photo.title || "Untitled"}</h4>
                            <p>
                              Section:{" "}
                              {sections.find((s) => s.id === photo.sectionId)
                                ?.name || "Unknown"}
                              {photo.buildingId && (
                                <span>
                                  {" "}
                                  · Building:{" "}
                                  {buildings.find(
                                    (b) => b.id === photo.buildingId,
                                  )?.name || `#${photo.buildingId}`}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="photo-admin-actions">
                            <button
                              onClick={() => openPhotoModal(photo)}
                              title="Edit"
                            >
                              <HiOutlinePencilSquare />
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => {
                                setEditingPhoto(photo);
                                setShowDeletePhotoModal(true);
                              }}
                              title="Delete"
                            >
                              <HiOutlineTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Change Role Modal ─── */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Change User Role"
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setShowRoleModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleRoleUpdate}
              disabled={usersLoading}
            >
              {usersLoading ? (
                <>
                  <div className="spinner" /> Updating...
                </>
              ) : (
                "Update Role"
              )}
            </button>
          </>
        }
      >
        <p className="confirm-text" style={{ marginBottom: "1rem" }}>
          Change <strong>{selectedUser?.username}</strong>'s role from{" "}
          <strong>{selectedUser?.role}</strong> to:
        </p>
        <div className="form-group">
          <select
            className="role-select"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "Admin" | "User")}
          >
            <option value="Admin">🛡️ Admin</option>
            <option value="User">👤 User</option>
          </select>
        </div>
      </Modal>

      {/* ─── Delete User Modal ─── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteUser}
              disabled={usersLoading}
            >
              {usersLoading ? (
                <>
                  <div className="spinner" /> Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </button>
          </>
        }
      >
        <p className="confirm-text">
          Are you sure you want to delete user{" "}
          <strong>{selectedUser?.username}</strong> ({selectedUser?.email})?
          This action cannot be undone.
        </p>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          GALLERY MODALS
         ═══════════════════════════════════════════════════════════ */}

      {/* Section Modal */}
      <Modal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        title={editingSection ? "Edit Section" : "Create Section"}
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setShowSectionModal(false)}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveSection}>
              {editingSection ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Section Name *</label>
          <input
            className="user-search-input"
            style={{ width: "100%" }}
            placeholder="e.g., Completed Projects"
            value={sectionForm.name}
            onChange={(e) =>
              setSectionForm({ ...sectionForm, name: e.target.value })
            }
          />
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label className="form-label">Description</label>
          <textarea
            className="user-search-input"
            style={{ width: "100%", minHeight: 80, resize: "vertical" }}
            placeholder="Optional description..."
            value={sectionForm.description || ""}
            onChange={(e) =>
              setSectionForm({ ...sectionForm, description: e.target.value })
            }
          />
        </div>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Display Order</label>
            <input
              type="number"
              className="user-search-input"
              style={{ width: "100%" }}
              value={sectionForm.displayOrder}
              onChange={(e) =>
                setSectionForm({
                  ...sectionForm,
                  displayOrder: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Status</label>
            <select
              className="role-select"
              value={sectionForm.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setSectionForm({
                  ...sectionForm,
                  isActive: e.target.value === "active",
                })
              }
            >
              <option value="active">✅ Active</option>
              <option value="inactive">⏸️ Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Section Modal */}
      <Modal
        isOpen={showDeleteSectionModal}
        onClose={() => setShowDeleteSectionModal(false)}
        title="Delete Section"
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setShowDeleteSectionModal(false)}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeleteSection}>
              Delete Section
            </button>
          </>
        }
      >
        <p className="confirm-text">
          Are you sure you want to delete section{" "}
          <strong>{editingSection?.name}</strong>? All photos in this section
          will also be deleted. This action cannot be undone.
        </p>
      </Modal>

      {/* Photo Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title={editingPhoto ? "Edit Photo" : "Add Photo"}
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setShowPhotoModal(false)}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSavePhoto}>
              {editingPhoto ? "Update" : "Add Photo"}
            </button>
          </>
        }
      >
        {/* Image Upload Section */}
        <div className="form-group">
          <label className="form-label">Upload Image *</label>
          <div
            className={`image-upload-area ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">
              <HiOutlineCloudArrowUp />
            </div>
            <input
              type="file"
              accept="image/*"
              id="photo-upload"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <label htmlFor="photo-upload" className="upload-btn">
              {uploadingImage ? (
                <>
                  <div className="spinner" /> Uploading...
                </>
              ) : (
                <>
                  <HiOutlinePlus /> Choose Image
                </>
              )}
            </label>
            <p className="upload-drag-text">or drag and drop your image here</p>
            <span className="upload-hint">Max 5MB · JPG, PNG, GIF, WebP</span>
          </div>
          {photoForm.imageUrl && (
            <div className="image-preview" style={{ marginTop: "1rem" }}>
              <img
                src={photoForm.imageUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 200,
                  borderRadius: 8,
                  objectFit: "cover",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setPhotoForm({ ...photoForm, imageUrl: "" })}
              >
                <HiOutlineTrash /> Remove Image
              </button>
            </div>
          )}
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label className="form-label">Title</label>
          <input
            className="user-search-input"
            style={{ width: "100%" }}
            placeholder="Photo title..."
            value={photoForm.title}
            onChange={(e) =>
              setPhotoForm({ ...photoForm, title: e.target.value })
            }
          />
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label className="form-label">Description</label>
          <textarea
            className="user-search-input"
            style={{ width: "100%", minHeight: 60, resize: "vertical" }}
            placeholder="Optional description..."
            value={photoForm.description || ""}
            onChange={(e) =>
              setPhotoForm({ ...photoForm, description: e.target.value })
            }
          />
        </div>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Section *</label>
            <select
              className="role-select"
              value={photoForm.sectionId}
              onChange={(e) =>
                setPhotoForm({
                  ...photoForm,
                  sectionId: parseInt(e.target.value),
                })
              }
            >
              <option value={0}>-- Select Section --</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Building (optional)</label>
            <select
              className="role-select"
              value={photoForm.buildingId || ""}
              onChange={(e) =>
                setPhotoForm({
                  ...photoForm,
                  buildingId: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            >
              <option value="">General / Not specific</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Display Order</label>
            <input
              type="number"
              className="user-search-input"
              style={{ width: "100%" }}
              value={photoForm.displayOrder}
              onChange={(e) =>
                setPhotoForm({
                  ...photoForm,
                  displayOrder: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Status</label>
            <select
              className="role-select"
              value={photoForm.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setPhotoForm({
                  ...photoForm,
                  isActive: e.target.value === "active",
                })
              }
            >
              <option value="active">✅ Active</option>
              <option value="inactive">⏸️ Inactive</option>
            </select>
          </div>
        </div>
        {photoForm.imageUrl && (
          <div style={{ marginTop: "1rem" }}>
            <label className="form-label">Preview</label>
            <div
              style={{ borderRadius: 8, overflow: "hidden", maxHeight: 200 }}
            >
              <img
                src={photoForm.imageUrl}
                alt="Preview"
                style={{ width: "100%", height: "auto", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Photo Modal */}
      <Modal
        isOpen={showDeletePhotoModal}
        onClose={() => setShowDeletePhotoModal(false)}
        title="Delete Photo"
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setShowDeletePhotoModal(false)}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeletePhoto}>
              Delete Photo
            </button>
          </>
        }
      >
        <p className="confirm-text">
          Are you sure you want to delete this photo
          {editingPhoto?.title ? ` "${editingPhoto.title}"` : ""}? This action
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default AdminPanel;
