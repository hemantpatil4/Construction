import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineHomeModern,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowLeft,
  HiOutlineSquare3Stack3D,
  HiOutlineMagnifyingGlass,
  HiOutlineExclamationTriangle,
  HiOutlineGlobeAlt,
  HiOutlinePhoto,
  HiOutlineEye,
} from "react-icons/hi2";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchBuildingById } from "../../store/slices/buildingSlice";
import { fetchPhotosByBuilding } from "../../store/slices/gallerySlice";
import {
  createFlat,
  updateFlat,
  deleteFlat,
} from "../../store/slices/flatSlice";
import type {
  FlatRead,
  CreateFlat,
  UpdateFlat,
} from "../../types/building.types";
import type { BuildingConfig } from "../../types/parametric.types";
import Modal from "../../components/Modal/Modal";
import ParametricViewer from "../../components/ParametricViewer/ParametricViewer";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./BuildingDetail.css";

type FilterType = "all" | "available" | "occupied";

const BuildingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { selectedBuilding, loading } = useAppSelector((s) => s.buildings);
  const { user } = useAppSelector((s) => s.auth);
  const { photos: buildingPhotos } = useAppSelector((s) => s.gallery);
  const flatLoading = useAppSelector((s) => s.flats.loading);
  const isAdmin = user?.role === "Admin";

  const [filter, setFilter] = useState<FilterType>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState<FlatRead | null>(null);
  const [viewerConfig, setViewerConfig] = useState<BuildingConfig | null>(null);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const [form, setForm] = useState<CreateFlat>({
    flatNumber: "",
    floorNumber: 1,
    areaInSqFt: 0,
    price: 0,
    isAvailable: true,
    buildingId: Number(id),
  });

  const refreshBuilding = () => {
    if (id) {
      dispatch(fetchBuildingById(Number(id)));
      dispatch(fetchPhotosByBuilding(Number(id)));
    }
  };

  useEffect(() => {
    refreshBuilding();
  }, [id, dispatch]);

  // Load parametric viewer config — match by building name
  useEffect(() => {
    const loadViewerConfig = async () => {
      try {
        const res = await fetch("/data/buildings.json");
        if (!res.ok) throw new Error("Failed to fetch viewer data");
        const configs: BuildingConfig[] = await res.json();
        // Match config to current building by name
        if (selectedBuilding) {
          const matched = configs.find(
            (c) =>
              c.buildingName.toLowerCase() ===
              selectedBuilding.name.toLowerCase(),
          );
          setViewerConfig(matched ?? null);
        }
      } catch {
        setViewerConfig(null);
      } finally {
        setViewerLoading(false);
      }
    };
    if (selectedBuilding) loadViewerConfig();
  }, [selectedBuilding]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else if (type === "number") {
      setForm({ ...form, [name]: Number(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Create Flat
  const handleCreateFlat = async () => {
    if (!form.flatNumber.trim()) {
      toast.error("Flat number is required");
      return;
    }
    if (form.areaInSqFt <= 0) {
      toast.error("Area must be greater than 0");
      return;
    }
    if (form.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    const result = await dispatch(
      createFlat({ ...form, buildingId: Number(id) }),
    );
    if (createFlat.fulfilled.match(result)) {
      toast.success("Flat created!");
      setShowCreateModal(false);
      resetForm();
      refreshBuilding();
    } else {
      toast.error(result.payload as string);
    }
  };

  // Edit Flat
  const handleEditOpen = (flat: FlatRead) => {
    setSelectedFlat(flat);
    setForm({
      flatNumber: flat.flatNumber,
      floorNumber: flat.floorNumber,
      areaInSqFt: flat.areaInSqFt,
      price: flat.price,
      isAvailable: flat.isAvailable,
      buildingId: flat.buildingId,
    });
    setShowEditModal(true);
  };

  const handleUpdateFlat = async () => {
    if (!selectedFlat) return;
    const data: UpdateFlat = {
      flatNumber: form.flatNumber,
      floorNumber: form.floorNumber,
      areaInSqFt: form.areaInSqFt,
      price: form.price,
      isAvailable: form.isAvailable,
      buildingId: Number(id),
    };
    const result = await dispatch(updateFlat({ id: selectedFlat.id, data }));
    if (updateFlat.fulfilled.match(result)) {
      toast.success("Flat updated!");
      setShowEditModal(false);
      setSelectedFlat(null);
      resetForm();
      refreshBuilding();
    } else {
      toast.error(result.payload as string);
    }
  };

  // Delete Flat
  const handleDeleteOpen = (flat: FlatRead) => {
    setSelectedFlat(flat);
    setShowDeleteModal(true);
  };

  const handleDeleteFlat = async () => {
    if (!selectedFlat) return;
    const result = await dispatch(deleteFlat(selectedFlat.id));
    if (deleteFlat.fulfilled.match(result)) {
      toast.success("Flat deleted!");
      setShowDeleteModal(false);
      setSelectedFlat(null);
      refreshBuilding();
    } else {
      toast.error(result.payload as string);
    }
  };

  const resetForm = () => {
    setForm({
      flatNumber: "",
      floorNumber: 1,
      areaInSqFt: 0,
      price: 0,
      isAvailable: true,
      buildingId: Number(id),
    });
  };

  // Filter flats
  const flats = selectedBuilding?.flats ?? [];
  const filteredFlats = flats.filter((f) => {
    if (filter === "available") return f.isAvailable;
    if (filter === "occupied") return !f.isAvailable;
    return true;
  });

  const availableCount = flats.filter((f) => f.isAvailable).length;
  const occupiedCount = flats.filter((f) => !f.isAvailable).length;

  if (loading) {
    return (
      <div className="building-detail">
        <div className="page-loader">
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  if (!selectedBuilding) {
    return (
      <div className="building-detail">
        <div className="building-detail-inner">
          <div className="empty-state">
            <div className="empty-state-icon">
              <HiOutlineMagnifyingGlass />
            </div>
            <h3>Building Not Found</h3>
            <p>The building you're looking for doesn't exist.</p>
            <Link to="/buildings" className="btn btn-primary">
              Back to Buildings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="building-detail fade-in">
      <div className="building-detail-inner">
        {/* Back Link */}
        <Link to="/buildings" className="back-link">
          <HiOutlineArrowLeft /> Back to Buildings
        </Link>

        {/* Building Info */}
        <div className="building-info-card">
          <div className="building-info-header">
            <h1>
              <HiOutlineBuildingOffice2 /> {selectedBuilding.name}
            </h1>
            <span
              className={`building-type-badge ${selectedBuilding.buildingType.toLowerCase()}`}
            >
              {selectedBuilding.buildingType}
            </span>
          </div>
          {selectedBuilding.description && (
            <p className="building-description">
              {selectedBuilding.description}
            </p>
          )}
          <div className="building-info-grid">
            <div className="info-item">
              <span className="info-item-label">Address</span>
              <span className="info-item-value">
                <HiOutlineMapPin /> {selectedBuilding.address}
              </span>
            </div>
            <div className="info-item">
              <span className="info-item-label">City</span>
              <span className="info-item-value">
                <HiOutlineMapPin /> {selectedBuilding.city}
              </span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Total Floors</span>
              <span className="info-item-value">
                <HiOutlineSquare3Stack3D /> {selectedBuilding.totalFloors}
              </span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Total Flats (Planned)</span>
              <span className="info-item-value">
                <HiOutlineHomeModern /> {selectedBuilding.totalFlats}
              </span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Base Area</span>
              <span className="info-item-value">
                <HiOutlineBuildingOffice2 />{" "}
                {selectedBuilding.baseAreaSqFt.toLocaleString()} sq ft
              </span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Registered Flats</span>
              <span className="info-item-value">
                <HiOutlineHomeModern /> {flats.length}
              </span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Available</span>
              <span className="info-item-value" style={{ color: "#10b981" }}>
                ● {availableCount}
              </span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Occupied</span>
              <span className="info-item-value" style={{ color: "#ef4444" }}>
                ● {occupiedCount}
              </span>
            </div>
            {selectedBuilding.yearBuilt && (
              <div className="info-item">
                <span className="info-item-label">Year Built</span>
                <span className="info-item-value">
                  <HiOutlineCalendar /> {selectedBuilding.yearBuilt}
                </span>
              </div>
            )}
            <div className="info-item">
              <span className="info-item-label">Created</span>
              <span className="info-item-value">
                <HiOutlineCalendar />{" "}
                {new Date(selectedBuilding.createdAt).toLocaleDateString()}
              </span>
            </div>
            {selectedBuilding.showOnMap &&
              selectedBuilding.latitude != null &&
              selectedBuilding.longitude != null && (
                <div className="info-item">
                  <span className="info-item-label">Location</span>
                  <span className="info-item-value">
                    <HiOutlineGlobeAlt /> {selectedBuilding.latitude.toFixed(4)}
                    , {selectedBuilding.longitude.toFixed(4)}
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* Mini Map for Building Location */}
        {selectedBuilding.showOnMap &&
          selectedBuilding.latitude != null &&
          selectedBuilding.longitude != null && (
            <BuildingMiniMap
              latitude={selectedBuilding.latitude}
              longitude={selectedBuilding.longitude}
              name={selectedBuilding.name}
              address={selectedBuilding.address}
              city={selectedBuilding.city}
            />
          )}

        {/* 3D Parametric Building Viewer */}
        {viewerLoading ? (
          <div className="viewer-placeholder">
            <div className="spinner" />
            <p>Loading 3D Viewer…</p>
          </div>
        ) : viewerConfig ? (
          <ParametricViewer config={viewerConfig} />
        ) : (
          <div className="viewer-not-configured">
            <HiOutlineExclamationTriangle className="viewer-nc-icon" />
            <h3>3D Viewer Not Configured</h3>
            <p>
              Parametric 3D viewer is not yet configured for{" "}
              <strong>{selectedBuilding.name}</strong>. Contact the
              administrator to set up the building layout.
            </p>
          </div>
        )}

        {/* Flats Section */}
        <div className="flats-section-header">
          <h2>
            <HiOutlineHomeModern /> Flats ({flats.length})
          </h2>
          {isAdmin && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
            >
              <HiOutlinePlusCircle /> Add Flat
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flat-filters">
          <button
            className={`flat-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({flats.length})
          </button>
          <button
            className={`flat-filter-btn ${filter === "available" ? "active" : ""}`}
            onClick={() => setFilter("available")}
          >
            Available ({availableCount})
          </button>
          <button
            className={`flat-filter-btn ${filter === "occupied" ? "active" : ""}`}
            onClick={() => setFilter("occupied")}
          >
            Occupied ({occupiedCount})
          </button>
        </div>

        {/* Flats Table */}
        {filteredFlats.length > 0 ? (
          <div className="flats-table-wrapper">
            <table className="flats-table">
              <thead>
                <tr>
                  <th>Flat No.</th>
                  <th>Floor</th>
                  <th>Area (sq ft)</th>
                  <th>Price (₹)</th>
                  <th>Status</th>
                  <th>Interior</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredFlats.map((flat) => (
                  <tr key={flat.id}>
                    <td style={{ fontWeight: 700 }}>{flat.flatNumber}</td>
                    <td>{flat.floorNumber}</td>
                    <td>{flat.areaInSqFt.toLocaleString()}</td>
                    <td className="price-cell">
                      ₹{flat.price.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${flat.isAvailable ? "available" : "occupied"}`}
                      >
                        {flat.isAvailable ? "● Available" : "● Occupied"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-interior-tour"
                        onClick={() =>
                          navigate(`/flat/${flat.flatNumber}/interior`)
                        }
                        title="View 3D Interior"
                      >
                        <HiOutlineEye /> Walk-through
                      </button>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => handleEditOpen(flat)}
                            title="Edit"
                          >
                            <HiOutlinePencilSquare />
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteOpen(flat)}
                            title="Delete"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <HiOutlineHomeModern />
            </div>
            <h3>No Flats {filter !== "all" ? `(${filter})` : ""}</h3>
            <p>
              {filter !== "all"
                ? `No ${filter} flats found. Try a different filter.`
                : isAdmin
                  ? "Add your first flat to this building."
                  : "No flats have been added yet."}
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BUILDING GALLERY
         ═══════════════════════════════════════════════════════════ */}
      {buildingPhotos.length > 0 && (
        <div className="building-detail-card building-gallery-section">
          <div className="building-detail-card-header">
            <h2>
              <HiOutlinePhoto /> Building Gallery
            </h2>
            <span className="photo-count">{buildingPhotos.length} photos</span>
          </div>
          <div className="building-photos-grid">
            {buildingPhotos
              .filter((p) => p.isActive)
              .map((photo) => (
                <div
                  key={photo.id}
                  className="building-photo-item"
                  onClick={() =>
                    setLightboxPhoto({
                      url: photo.imageUrl,
                      title: photo.title || "",
                    })
                  }
                >
                  <img
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={photo.title || "Building photo"}
                    loading="lazy"
                  />
                  <div className="building-photo-overlay">
                    <HiOutlineMagnifyingGlass />
                  </div>
                  {photo.title && (
                    <div className="building-photo-title">{photo.title}</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="building-lightbox"
          onClick={() => setLightboxPhoto(null)}
        >
          <button className="lightbox-close" aria-label="Close">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={lightboxPhoto.url} alt={lightboxPhoto.title} />
            {lightboxPhoto.title && (
              <div className="lightbox-title">{lightboxPhoto.title}</div>
            )}
          </div>
        </div>
      )}

      {/* ─── Create Flat Modal ─── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Flat"
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateFlat}
              disabled={flatLoading}
            >
              {flatLoading ? (
                <>
                  <div className="spinner" /> Creating...
                </>
              ) : (
                "Create Flat"
              )}
            </button>
          </>
        }
      >
        <FlatForm form={form} handleChange={handleChange} />
      </Modal>

      {/* ─── Edit Flat Modal ─── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Flat"
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateFlat}
              disabled={flatLoading}
            >
              {flatLoading ? (
                <>
                  <div className="spinner" /> Updating...
                </>
              ) : (
                "Update Flat"
              )}
            </button>
          </>
        }
      >
        <FlatForm form={form} handleChange={handleChange} />
      </Modal>

      {/* ─── Delete Flat Modal ─── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Flat"
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
              onClick={handleDeleteFlat}
              disabled={flatLoading}
            >
              {flatLoading ? (
                <>
                  <div className="spinner" /> Deleting...
                </>
              ) : (
                "Delete Flat"
              )}
            </button>
          </>
        }
      >
        <p className="confirm-text">
          Are you sure you want to delete flat{" "}
          <strong>{selectedFlat?.flatNumber}</strong>? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
};

// ─── Reusable Flat Form ───
const FlatForm = ({
  form,
  handleChange,
}: {
  form: CreateFlat;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
}) => (
  <>
    <div className="form-group">
      <label className="form-label">Flat Number</label>
      <input
        className="form-input"
        name="flatNumber"
        placeholder="e.g. A-101"
        value={form.flatNumber}
        onChange={handleChange}
        autoFocus
      />
    </div>
    <div className="form-group">
      <label className="form-label">Floor Number</label>
      <input
        className="form-input"
        name="floorNumber"
        type="number"
        min={0}
        value={form.floorNumber}
        onChange={handleChange}
      />
    </div>
    <div className="form-group">
      <label className="form-label">Area (sq ft)</label>
      <input
        className="form-input"
        name="areaInSqFt"
        type="number"
        min={0}
        placeholder="e.g. 850"
        value={form.areaInSqFt || ""}
        onChange={handleChange}
      />
    </div>
    <div className="form-group">
      <label className="form-label">Price (₹)</label>
      <input
        className="form-input"
        name="price"
        type="number"
        min={0}
        placeholder="e.g. 4500000"
        value={form.price || ""}
        onChange={handleChange}
      />
    </div>
    <div className="form-group">
      <label
        className="form-label"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          name="isAvailable"
          checked={form.isAvailable}
          onChange={handleChange}
          style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }}
        />
        Available for sale/rent
      </label>
    </div>
  </>
);

// ─── Mini Map Component ───
const buildingIcon = new L.Icon({
  iconUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const BuildingMiniMap = ({
  latitude,
  longitude,
  name,
  address,
  city,
}: {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  city: string;
}) => (
  <div className="building-mini-map">
    <h3>
      <HiOutlineGlobeAlt /> Building Location
    </h3>
    <div className="mini-map-container">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "var(--radius-md)",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={buildingIcon}>
          <Popup>
            <strong>{name}</strong>
            <br />
            {address}, {city}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  </div>
);

export default BuildingDetail;
