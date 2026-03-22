import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Html, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { FlatRead } from "../../types/building.types";
import "./BuildingViewer3D.css";

// ─── Types ───
interface BuildingViewer3DProps {
  totalFloors: number;
  totalFlats: number;
  baseAreaSqFt: number;
  buildingType: string;
  buildingName: string;
  flats: FlatRead[];
}

interface FloorProps {
  floorNumber: number;
  y: number;
  width: number;
  depth: number;
  flatsPerFloor: number;
  flats: FlatRead[];
  isHighlighted: boolean;
  onHover: (floor: number | null) => void;
  onClick: (floor: number) => void;
}

interface FlatBoxProps {
  flat: FlatRead;
  position: [number, number, number];
  size: [number, number, number];
  isHighlighted: boolean;
  onHover: (flat: FlatRead | null) => void;
}

// ─── Individual Flat Box ───
const FlatBox = ({
  flat,
  position,
  size,
  isHighlighted,
  onHover,
}: FlatBoxProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = flat.isAvailable ? "#10b981" : "#ef4444";
  const hoverColor = flat.isAvailable ? "#34d399" : "#f87171";

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(flat);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={isHighlighted ? hoverColor : color}
        transparent
        opacity={isHighlighted ? 1 : 0.85}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
};

// ─── Single Floor ───
const Floor = ({
  floorNumber,
  y,
  width,
  depth,
  flatsPerFloor,
  flats,
  isHighlighted,
  onHover,
  onClick,
}: FloorProps) => {
  const floorFlats = flats.filter((f) => f.floorNumber === floorNumber);
  const [hoveredFlat, setHoveredFlat] = useState<FlatRead | null>(null);

  // Calculate flat positions within the floor
  const flatColumns = Math.min(flatsPerFloor, 6);
  const flatRows = Math.ceil(flatsPerFloor / flatColumns);
  const flatWidth = (width - 0.2) / flatColumns;
  const flatDepth = (depth - 0.2) / flatRows;
  const floorHeight = 0.8;

  return (
    <group position={[0, y, 0]}>
      {/* Floor slab */}
      <mesh
        position={[0, -0.05, 0]}
        onPointerOver={() => onHover(floorNumber)}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onClick(floorNumber);
        }}
      >
        <boxGeometry args={[width + 0.3, 0.1, depth + 0.3]} />
        <meshStandardMaterial
          color={isHighlighted ? "#3b82f6" : "#94a3b8"}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Floor label */}
      <Text
        position={[-(width / 2) - 0.5, floorHeight / 2, 0]}
        fontSize={0.25}
        color={isHighlighted ? "#3b82f6" : "#64748b"}
        anchorX="right"
        anchorY="middle"
      >
        {`F${floorNumber}`}
      </Text>

      {/* Flat boxes */}
      {Array.from({ length: flatsPerFloor }, (_, i) => {
        const col = i % flatColumns;
        const row = Math.floor(i / flatColumns);
        const x = -width / 2 + flatWidth / 2 + col * flatWidth + 0.1;
        const z = -depth / 2 + flatDepth / 2 + row * flatDepth + 0.1;
        const flat = floorFlats[i];

        if (!flat) {
          // Empty slot (no flat registered yet)
          return (
            <mesh key={`empty-${i}`} position={[x, floorHeight / 2, z]}>
              <boxGeometry
                args={[flatWidth - 0.08, floorHeight - 0.1, flatDepth - 0.08]}
              />
              <meshStandardMaterial
                color="#cbd5e1"
                transparent
                opacity={0.3}
                wireframe
              />
            </mesh>
          );
        }

        return (
          <FlatBox
            key={flat.id}
            flat={flat}
            position={[x, floorHeight / 2, z]}
            size={[flatWidth - 0.08, floorHeight - 0.1, flatDepth - 0.08]}
            isHighlighted={hoveredFlat?.id === flat.id}
            onHover={setHoveredFlat}
          />
        );
      })}

      {/* Tooltip for hovered flat */}
      {hoveredFlat && (
        <Html
          position={[0, floorHeight + 0.3, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div className="viewer3d-tooltip">
            <strong>{hoveredFlat.flatNumber}</strong>
            <span>Floor {hoveredFlat.floorNumber}</span>
            <span>{hoveredFlat.areaInSqFt} sq ft</span>
            <span>₹{hoveredFlat.price.toLocaleString()}</span>
            <span
              className={hoveredFlat.isAvailable ? "available" : "occupied"}
            >
              {hoveredFlat.isAvailable ? "✅ Available" : "🔴 Occupied"}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

// ─── Building 3D Model ───
const BuildingModel = ({
  totalFloors,
  totalFlats,
  baseAreaSqFt,
  buildingName,
  flats,
}: Omit<BuildingViewer3DProps, "buildingType">) => {
  const [highlightedFloor, setHighlightedFloor] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // Calculate building dimensions from base area
  const scale = Math.sqrt(baseAreaSqFt) / 100; // Normalize
  const width = Math.max(3, Math.min(8, scale * 4));
  const depth = Math.max(2, Math.min(6, scale * 3));
  const flatsPerFloor = Math.max(1, Math.ceil(totalFlats / totalFloors));
  const floorHeight = 0.9; // Height of each floor unit

  // Total building height
  const buildingHeight = totalFloors * floorHeight;

  // Camera position based on building size
  const cameraDistance = Math.max(buildingHeight, width) * 1.5;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />

      {/* Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.15, 0]}
        receiveShadow
      >
        <planeGeometry args={[width + 6, depth + 6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      {/* Ground grid */}
      <gridHelper
        args={[width + 6, 20, "#cbd5e1", "#e2e8f0"]}
        position={[0, -0.14, 0]}
      />

      {/* Building name label */}
      <Text
        position={[0, buildingHeight + 0.8, 0]}
        fontSize={0.4}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        {buildingName}
      </Text>

      {/* Floors */}
      {Array.from({ length: totalFloors }, (_, i) => {
        const floorNum = i + 1;
        return (
          <Floor
            key={floorNum}
            floorNumber={floorNum}
            y={i * floorHeight}
            width={width}
            depth={depth}
            flatsPerFloor={flatsPerFloor}
            flats={flats}
            isHighlighted={
              highlightedFloor === floorNum || selectedFloor === floorNum
            }
            onHover={setHighlightedFloor}
            onClick={setSelectedFloor}
          />
        );
      })}

      {/* Roof */}
      <mesh position={[0, buildingHeight + 0.1, 0]}>
        <boxGeometry args={[width + 0.4, 0.15, depth + 0.4]} />
        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        minDistance={3}
        maxDistance={cameraDistance * 2}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
        dampingFactor={0.05}
        target={[0, buildingHeight / 2, 0]}
      />

      <Environment preset="city" />
    </>
  );
};

// ─── Main Component ───
const BuildingViewer3D = (props: BuildingViewer3DProps) => {
  const {
    totalFloors,
    totalFlats,
    baseAreaSqFt,
    buildingType,
    buildingName,
    flats,
  } = props;

  const [isExpanded, setIsExpanded] = useState(false);

  // Stats
  const availableFlats = flats.filter((f) => f.isAvailable).length;
  const occupiedFlats = flats.filter((f) => !f.isAvailable).length;
  const occupancyRate =
    flats.length > 0 ? Math.round((occupiedFlats / flats.length) * 100) : 0;

  const buildingHeight = totalFloors * 0.9;
  const cameraZ = Math.max(buildingHeight, 5) * 1.5;

  return (
    <div className={`viewer3d-container ${isExpanded ? "expanded" : ""}`}>
      <div className="viewer3d-header">
        <div className="viewer3d-title">
          <span className="viewer3d-icon">🏗️</span>
          <h3>3D Building Viewer</h3>
          <span className={`viewer3d-type-badge ${buildingType.toLowerCase()}`}>
            {buildingType}
          </span>
        </div>
        <div className="viewer3d-actions">
          <button
            className="viewer3d-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "⤓ Collapse" : "⤢ Expand"}
          </button>
        </div>
      </div>

      <div className="viewer3d-canvas-wrapper">
        <Canvas
          camera={{
            position: [cameraZ * 0.7, cameraZ * 0.6, cameraZ * 0.7],
            fov: 50,
            near: 0.1,
            far: 200,
          }}
          shadows
          style={{
            background: "linear-gradient(180deg, #f0f4f8 0%, #dbeafe 100%)",
          }}
        >
          <BuildingModel
            totalFloors={totalFloors}
            totalFlats={totalFlats}
            baseAreaSqFt={baseAreaSqFt}
            buildingName={buildingName}
            flats={flats}
          />
        </Canvas>

        {/* Legend overlay */}
        <div className="viewer3d-legend">
          <div className="legend-item">
            <span className="legend-color available" />
            Available ({availableFlats})
          </div>
          <div className="legend-item">
            <span className="legend-color occupied" />
            Occupied ({occupiedFlats})
          </div>
          <div className="legend-item">
            <span className="legend-color empty" />
            Unregistered
          </div>
        </div>

        {/* Stats overlay */}
        <div className="viewer3d-stats">
          <div className="viewer3d-stat">
            <span className="stat-value">{totalFloors}</span>
            <span className="stat-label">Floors</span>
          </div>
          <div className="viewer3d-stat">
            <span className="stat-value">
              {flats.length}/{totalFlats}
            </span>
            <span className="stat-label">Flats</span>
          </div>
          <div className="viewer3d-stat">
            <span className="stat-value">{occupancyRate}%</span>
            <span className="stat-label">Occupancy</span>
          </div>
        </div>

        {/* Controls hint */}
        <div className="viewer3d-controls-hint">
          🖱️ Drag to rotate • Scroll to zoom • Right-click to pan
        </div>
      </div>
    </div>
  );
};

export default BuildingViewer3D;
