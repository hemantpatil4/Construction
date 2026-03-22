import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineHomeModern,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchFlats,
  createFlat,
  updateFlat,
  deleteFlat,
} from "../../store/slices/flatSlice";
import { fetchBuildings } from "../../store/slices/buildingSlice";
import type {
  FlatRead,
  CreateFlat,
  UpdateFlat,
} from "../../types/building.types";
import Modal from "../../components/Modal/Modal";
import toast from "react-hot-toast";
import "./Flats.css";

type FilterType = "all" | "available" | "occupied";

const Flats = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { flats, loading } = useAppSelector((s) => s.flats);
  const { buildings } = useAppSelector((s) => s.buildings);
  const { user } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === "Admin";

  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState<FlatRead | null>(null);

  const [form, setForm] = useState<CreateFlat>({
    flatNumber: "",
    floorNumber: 1,
    areaInSqFt: 0,
    price: 0,
    isAvailable: true,
    buildingId: 0,
  });

  useEffect(() => {
    dispatch(fetchFlats());
    dispatch(fetchBuildings());
  }, [dispatch]);

  const refreshFlats = () => dispatch(fetchFlats());

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else if (type === "number" || name === "buildingId") {
      setForm({ ...form, [name]: Number(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Filtered + searched flats
  const filteredFlats = flats
    .filter((f) => {
      if (filter === "available") return f.isAvailable;
      if (filter === "occupied") return !f.isAvailable;
      return true;
    })
    .filter((f) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        f.flatNumber.toLowerCase().includes(q) ||
        f.buildingName.toLowerCase().includes(q) ||
        f.floorNumber.toString().includes(q)
      );
    });

  const availableCount = flats.filter((f) => f.isAvailable).length;
  const occupiedCount = flats.filter((f) => !f.isAvailable).length;

  // Create
  const handleCreateFlat = async () => {
    if (!form.flatNumber.trim()) {
      toast.error("Flat number is required");
      return;
    }
    if (!form.buildingId) {
      toast.error("Select a building");
      return;
    }
    if (form.areaInSqFt <= 0) {
      toast.error("Area must be > 0");
      return;
    }
    if (form.price <= 0) {
      toast.error("Price must be > 0");
      return;
    }

    const result = await dispatch(createFlat(form));
    if (createFlat.fulfilled.match(result)) {
      toast.success("Flat created!");
      setShowCreateModal(false);
      resetForm();
      refreshFlats();
    } else {
      toast.error(result.payload as string);
    }
  };

  // Edit
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
      buildingId: form.buildingId,
    };
    const result = await dispatch(updateFlat({ id: selectedFlat.id, data }));
    if (updateFlat.fulfilled.match(result)) {
      toast.success("Flat updated!");
      setShowEditModal(false);
      setSelectedFlat(null);
      resetForm();
      refreshFlats();
    } else {
      toast.error(result.payload as string);
    }
  };

  // Delete
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
      refreshFlats();
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
      buildingId: 0,
    });
  };

  if (loading) {
    return (
      <div className="flats-page">
        <div className="page-loader">
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flats-page fade-in">
      <div className="flats-page-inner">
        {/* Header */}
        <div className="flats-page-header">
          <h1>
            <HiOutlineHomeModern /> All Flats
          </h1>
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
            >
              <HiOutlinePlusCircle /> Add Flat
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flat-stats-row">
          <div className="flat-stat-card">
            <div className="stat-number">{flats.length}</div>
            <div className="stat-label">Total Flats</div>
          </div>
          <div className="flat-stat-card available">
            <div className="stat-number">{availableCount}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="flat-stat-card occupied">
            <div className="stat-number">{occupiedCount}</div>
            <div className="stat-label">Occupied</div>
          </div>
          <div className="flat-stat-card">
            <div className="stat-number">{buildings.length}</div>
            <div className="stat-label">Buildings</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flats-toolbar">
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
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <HiOutlineMagnifyingGlass
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              className="search-input"
              style={{ paddingLeft: "2.2rem", width: "100%" }}
              placeholder="Search flats by number, building…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {filteredFlats.length > 0 ? (
          <div className="flats-table-wrapper">
            <table className="flats-table">
              <thead>
                <tr>
                  <th>Flat No.</th>
                  <th>Building</th>
                  <th>Floor</th>
                  <th>Area (sq ft)</th>
                  <th>Price (₹)</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredFlats.map((flat) => (
                  <tr key={flat.id}>
                    <td style={{ fontWeight: 700 }}>{flat.flatNumber}</td>
                    <td>
                      <span
                        className="building-name-cell"
                        onClick={() =>
                          navigate(`/buildings/${flat.buildingId}`)
                        }
                      >
                        {flat.buildingName}
                      </span>
                    </td>
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
            <h3>No Flats Found</h3>
            <p>
              {search
                ? "No results match your search."
                : "No flats have been created yet."}
            </p>
          </div>
        )}
      </div>

      {/* ─── Create Modal ─── */}
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
              disabled={loading}
            >
              {loading ? (
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
        <FlatFormFull
          form={form}
          handleChange={handleChange}
          buildings={buildings}
        />
      </Modal>

      {/* ─── Edit Modal ─── */}
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
              disabled={loading}
            >
              {loading ? (
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
        <FlatFormFull
          form={form}
          handleChange={handleChange}
          buildings={buildings}
        />
      </Modal>

      {/* ─── Delete Modal ─── */}
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
              disabled={loading}
            >
              {loading ? (
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
          <strong>{selectedFlat?.flatNumber}</strong> from{" "}
          <strong>{selectedFlat?.buildingName}</strong>? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
};

// ─── Flat Form with Building Selector ───
const FlatFormFull = ({
  form,
  handleChange,
  buildings,
}: {
  form: CreateFlat;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  buildings: { id: number; name: string }[];
}) => (
  <>
    <div className="form-group">
      <label className="form-label">Building</label>
      <select
        className="form-input"
        name="buildingId"
        value={form.buildingId}
        onChange={handleChange}
      >
        <option value={0}>— Select Building —</option>
        {buildings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
    <div className="form-group">
      <label className="form-label">Flat Number</label>
      <input
        className="form-input"
        name="flatNumber"
        placeholder="e.g. A-101"
        value={form.flatNumber}
        onChange={handleChange}
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

export default Flats;
