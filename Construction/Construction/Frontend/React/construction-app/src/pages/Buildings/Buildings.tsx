import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineHomeModern,
  HiOutlineCalendar,
  HiOutlineSquare3Stack3D,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from "../../store/slices/buildingSlice";
import type {
  CreateBuilding,
  UpdateBuilding,
  BuildingRead,
} from "../../types/building.types";
import Modal from "../../components/Modal/Modal";
import toast from "react-hot-toast";
import "./Buildings.css";

const BUILDING_TYPES = ["Residential", "Commercial", "Mixed"];

const emptyForm: CreateBuilding = {
  name: "",
  address: "",
  city: "",
  totalFloors: 1,
  totalFlats: 1,
  baseAreaSqFt: 0,
  buildingType: "Residential",
  yearBuilt: null,
  description: null,
  latitude: null,
  longitude: null,
  showOnMap: false,
};

const Buildings = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildings, loading } = useAppSelector((s) => s.buildings);
  const { user } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === "Admin";

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingRead | null>(
    null,
  );

  // Form state
  const [form, setForm] = useState<CreateBuilding>({ ...emptyForm });

  useEffect(() => {
    dispatch(fetchBuildings());
  }, [dispatch]);

  // ─── Handlers ───

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const validateForm = (): boolean => {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error("Please fill in name, address, and city");
      return false;
    }
    if (form.totalFloors < 1 || form.totalFloors > 200) {
      toast.error("Total floors must be between 1 and 200");
      return false;
    }
    if (form.totalFlats < 1 || form.totalFlats > 5000) {
      toast.error("Total flats must be between 1 and 5000");
      return false;
    }
    if (!form.baseAreaSqFt || form.baseAreaSqFt <= 0) {
      toast.error("Base area must be greater than 0");
      return false;
    }
    if (!BUILDING_TYPES.includes(form.buildingType)) {
      toast.error("Please select a valid building type");
      return false;
    }
    if (
      form.yearBuilt !== null &&
      form.yearBuilt !== undefined &&
      (form.yearBuilt < 1800 || form.yearBuilt > new Date().getFullYear())
    ) {
      toast.error(
        `Year built must be between 1800 and ${new Date().getFullYear()}`,
      );
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    const payload: CreateBuilding = {
      ...form,
      yearBuilt: form.yearBuilt || null,
      description: form.description?.trim() || null,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
      showOnMap: form.showOnMap ?? false,
    };
    const result = await dispatch(createBuilding(payload));
    if (createBuilding.fulfilled.match(result)) {
      toast.success("Building created successfully!");
      setShowCreateModal(false);
      setForm({ ...emptyForm });
    } else {
      toast.error(result.payload as string);
    }
  };

  const handleEditOpen = (b: BuildingRead, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBuilding(b);
    setForm({
      name: b.name,
      address: b.address,
      city: b.city,
      totalFloors: b.totalFloors,
      totalFlats: b.totalFlats,
      baseAreaSqFt: b.baseAreaSqFt,
      buildingType: b.buildingType,
      yearBuilt: b.yearBuilt ?? null,
      description: b.description ?? null,
      latitude: b.latitude ?? null,
      longitude: b.longitude ?? null,
      showOnMap: b.showOnMap ?? false,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedBuilding) return;
    if (!validateForm()) return;
    const data: UpdateBuilding = {
      name: form.name,
      address: form.address,
      city: form.city,
      totalFloors: form.totalFloors,
      totalFlats: form.totalFlats,
      baseAreaSqFt: form.baseAreaSqFt,
      buildingType: form.buildingType,
      yearBuilt: form.yearBuilt || null,
      description: form.description?.trim() || null,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
      showOnMap: form.showOnMap ?? false,
    };
    const result = await dispatch(
      updateBuilding({ id: selectedBuilding.id, data }),
    );
    if (updateBuilding.fulfilled.match(result)) {
      toast.success("Building updated successfully!");
      setShowEditModal(false);
      setSelectedBuilding(null);
      setForm({ ...emptyForm });
      dispatch(fetchBuildings());
    } else {
      toast.error(result.payload as string);
    }
  };

  const handleDeleteOpen = (b: BuildingRead, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBuilding(b);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedBuilding) return;
    const result = await dispatch(deleteBuilding(selectedBuilding.id));
    if (deleteBuilding.fulfilled.match(result)) {
      toast.success("Building deleted successfully!");
      setShowDeleteModal(false);
      setSelectedBuilding(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const handleCardClick = (id: number) => {
    navigate(`/buildings/${id}`);
  };

  // Stats
  const totalFlats = buildings.reduce((sum, b) => sum + b.flatCount, 0);

  // ─── Form Fields JSX (reused in create & edit modals) ───
  const renderFormFields = () => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Building Name *</label>
          <input
            className="form-input"
            name="name"
            placeholder="e.g. Skyline Tower"
            value={form.name}
            onChange={handleChange}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Building Type *</label>
          <select
            className="form-input"
            name="buildingType"
            value={form.buildingType}
            onChange={handleChange}
          >
            {BUILDING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Address *</label>
        <input
          className="form-input"
          name="address"
          placeholder="e.g. 123 Main Street"
          value={form.address}
          onChange={handleChange}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">City *</label>
          <input
            className="form-input"
            name="city"
            placeholder="e.g. Mumbai"
            value={form.city}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Year Built</label>
          <input
            className="form-input"
            name="yearBuilt"
            type="number"
            placeholder="e.g. 2020"
            value={form.yearBuilt ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                yearBuilt:
                  e.target.value === "" ? null : Number(e.target.value),
              }))
            }
          />
        </div>
      </div>
      <div className="form-row form-row-3">
        <div className="form-group">
          <label className="form-label">Total Floors *</label>
          <input
            className="form-input"
            name="totalFloors"
            type="number"
            min={1}
            max={200}
            placeholder="e.g. 10"
            value={form.totalFloors}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Total Flats *</label>
          <input
            className="form-input"
            name="totalFlats"
            type="number"
            min={1}
            max={5000}
            placeholder="e.g. 40"
            value={form.totalFlats}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Base Area (sq ft) *</label>
          <input
            className="form-input"
            name="baseAreaSqFt"
            type="number"
            min={1}
            step="0.01"
            placeholder="e.g. 5000"
            value={form.baseAreaSqFt || ""}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-input form-textarea"
          name="description"
          placeholder="Brief description of the building (optional)"
          value={form.description ?? ""}
          onChange={handleChange}
          rows={3}
          maxLength={1000}
        />
      </div>

      {/* ─── Map / Location Fields (Admin Only) ─── */}
      {isAdmin && (
        <>
          <div className="form-divider">
            <HiOutlineGlobeAlt /> Map Location
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                className="form-input"
                name="latitude"
                type="number"
                step="any"
                placeholder="e.g. 18.5204"
                value={form.latitude ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    latitude:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                className="form-input"
                name="longitude"
                type="number"
                step="any"
                placeholder="e.g. 73.8567"
                value={form.longitude ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    longitude:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </div>
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
                name="showOnMap"
                checked={form.showOnMap ?? false}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    showOnMap: e.target.checked,
                  }))
                }
                style={{
                  width: 18,
                  height: 18,
                  accentColor: "var(--color-primary)",
                }}
              />
              Show on Map
            </label>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="buildings-page fade-in">
      <div className="buildings-inner">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>
              <HiOutlineBuildingOffice2 /> Buildings
            </h1>
            <p className="page-header-sub">
              {isAdmin
                ? "Manage all buildings in the system"
                : "View all registered buildings"}
            </p>
          </div>
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setForm({ ...emptyForm });
                setShowCreateModal(true);
              }}
            >
              <HiOutlinePlusCircle /> Add Building
            </button>
          )}
        </div>

        {/* Mini Stats */}
        <div className="mini-stats">
          <div className="mini-stat">
            <div className="mini-stat-icon blue">
              <HiOutlineBuildingOffice2 />
            </div>
            <div>
              <div className="mini-stat-value">{buildings.length}</div>
              <div className="mini-stat-label">Total Buildings</div>
            </div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-icon green">
              <HiOutlineHomeModern />
            </div>
            <div>
              <div className="mini-stat-value">{totalFlats}</div>
              <div className="mini-stat-label">Total Flats</div>
            </div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-icon orange">
              <HiOutlineMapPin />
            </div>
            <div>
              <div className="mini-stat-value">
                {new Set(buildings.map((b) => b.city)).size}
              </div>
              <div className="mini-stat-label">Cities</div>
            </div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-icon purple">
              <HiOutlineGlobeAlt />
            </div>
            <div>
              <div className="mini-stat-value">
                {buildings.filter((b) => b.showOnMap).length}
              </div>
              <div className="mini-stat-label">On Map</div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="page-loader">
            <div className="spinner spinner-lg" />
          </div>
        )}

        {/* Buildings Grid */}
        {!loading && buildings.length > 0 && (
          <div className="buildings-grid">
            {buildings.map((b) => (
              <div
                className="building-card slide-up"
                key={b.id}
                onClick={() => handleCardClick(b.id)}
              >
                <div className="building-card-header">
                  <div className="building-card-icon">
                    <HiOutlineBuildingOffice2 />
                  </div>
                  <span
                    className={`building-type-badge ${b.buildingType.toLowerCase()}`}
                  >
                    {b.buildingType}
                  </span>
                  {isAdmin && (
                    <div className="building-card-actions">
                      <button
                        onClick={(e) => handleEditOpen(b, e)}
                        title="Edit"
                      >
                        <HiOutlinePencilSquare />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDeleteOpen(b, e)}
                        title="Delete"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  )}
                </div>

                <h3>{b.name}</h3>

                <div className="building-card-info">
                  <div className="building-card-row">
                    <HiOutlineMapPin /> {b.address}, {b.city}
                  </div>
                  <div className="building-card-specs">
                    <span title="Total Floors">
                      <HiOutlineSquare3Stack3D /> {b.totalFloors} Floors
                    </span>
                    <span title="Base Area">
                      <HiOutlineBuildingOffice2 />{" "}
                      {b.baseAreaSqFt.toLocaleString()} sq ft
                    </span>
                  </div>
                </div>

                <div className="building-card-footer">
                  <span className="flat-count-badge">
                    <HiOutlineHomeModern /> {b.flatCount}/{b.totalFlats} Flats
                  </span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {b.showOnMap && (
                      <span className="map-badge" title="Visible on map">
                        <HiOutlineGlobeAlt />
                      </span>
                    )}
                    <span className="building-date">
                      <HiOutlineCalendar />{" "}
                      {b.yearBuilt ?? new Date(b.createdAt).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && buildings.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h3>No Buildings Yet</h3>
            <p>
              {isAdmin
                ? "Get started by adding your first building."
                : "No buildings have been added to the system yet."}
            </p>
            {isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <HiOutlinePlusCircle /> Add First Building
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Create Modal ─── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Building"
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
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Creating...
                </>
              ) : (
                "Create Building"
              )}
            </button>
          </>
        }
      >
        {renderFormFields()}
      </Modal>

      {/* ─── Edit Modal ─── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Building"
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
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Updating...
                </>
              ) : (
                "Update Building"
              )}
            </button>
          </>
        }
      >
        {renderFormFields()}
      </Modal>

      {/* ─── Delete Confirm Modal ─── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Building"
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
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Deleting...
                </>
              ) : (
                "Delete Building"
              )}
            </button>
          </>
        }
      >
        <p className="confirm-text">
          Are you sure you want to delete{" "}
          <strong>{selectedBuilding?.name}</strong>? This will also remove all
          flats associated with this building. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Buildings;
