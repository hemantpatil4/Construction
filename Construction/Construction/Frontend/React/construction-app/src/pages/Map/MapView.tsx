import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineGlobeAlt,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineSquare3Stack3D,
  HiOutlineHomeModern,
} from "react-icons/hi2";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchBuildings } from "../../store/slices/buildingSlice";
import "./MapView.css";

// Fix default Leaflet marker icon
const defaultIcon = new L.Icon({
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

const MapView = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildings, loading } = useAppSelector((s) => s.buildings);

  useEffect(() => {
    dispatch(fetchBuildings());
  }, [dispatch]);

  const mappedBuildings = buildings.filter(
    (b) => b.showOnMap && b.latitude != null && b.longitude != null,
  );

  // Calculate center from buildings, default to Pune, India
  const center: [number, number] =
    mappedBuildings.length > 0
      ? [
          mappedBuildings.reduce((sum, b) => sum + (b.latitude ?? 0), 0) /
            mappedBuildings.length,
          mappedBuildings.reduce((sum, b) => sum + (b.longitude ?? 0), 0) /
            mappedBuildings.length,
        ]
      : [18.5204, 73.8567];

  return (
    <div className="map-page fade-in">
      <div className="map-inner">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>
              <HiOutlineGlobeAlt /> Building Map
            </h1>
            <p className="page-header-sub">
              View all buildings on an interactive map
            </p>
          </div>
          <div className="map-stats">
            <span className="map-stat-badge">
              <HiOutlineBuildingOffice2 /> {mappedBuildings.length} Building
              {mappedBuildings.length !== 1 ? "s" : ""} on Map
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="page-loader">
            <div className="spinner spinner-lg" />
          </div>
        )}

        {/* Map */}
        {!loading && mappedBuildings.length > 0 && (
          <div className="map-container">
            <MapContainer
              center={center}
              zoom={12}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mappedBuildings.map((b) => (
                <Marker
                  key={b.id}
                  position={[b.latitude!, b.longitude!]}
                  icon={defaultIcon}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong className="map-popup-title">{b.name}</strong>
                      <span className="map-popup-address">
                        <HiOutlineMapPin /> {b.address}, {b.city}
                      </span>
                      <div className="map-popup-specs">
                        <span>
                          <HiOutlineSquare3Stack3D /> {b.totalFloors} Floors
                        </span>
                        <span>
                          <HiOutlineHomeModern /> {b.flatCount}/{b.totalFlats}{" "}
                          Flats
                        </span>
                      </div>
                      <button
                        className="map-popup-btn"
                        onClick={() => navigate(`/buildings/${b.id}`)}
                      >
                        View Details →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Empty State */}
        {!loading && mappedBuildings.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🗺️</div>
            <h3>No Buildings on Map</h3>
            <p>
              No buildings are currently enabled for map display. An admin can
              enable "Show on Map" when creating or editing a building.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
