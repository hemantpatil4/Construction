import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  Edges,
  Environment,
  Line,
} from "@react-three/drei";
import * as THREE from "three";
import {
  HiOutlineCube,
  HiOutlineArrowDown,
  HiOutlineEye,
  HiOutlineArrowsRightLeft,
  HiOutlineBuildingOffice2,
  HiOutlineArrowsPointingOut,
  HiOutlineArrowsPointingIn,
} from "react-icons/hi2";
import type {
  BuildingConfig,
  LayoutUnit,
  FlatInfo,
  Room,
} from "../../types/parametric.types";
import "./ParametricViewer.css";

// ═══════════════════════════════════════════════════════════
//  SCALE FACTOR — layout JSON units → Three.js world units
// ═══════════════════════════════════════════════════════════
const S = 0.25; // 1 JSON unit = 0.25 Three.js units
const ROOM_S = 0.12; // room scale for floor plan view (smaller = more detail)

// ─── Status → Color map ───
const STATUS_COLORS: Record<string, string> = {
  OWNER: "#e6a817",
  BUILDER: "#7ca6d8",
};
const HOVER_COLORS: Record<string, string> = {
  OWNER: "#f0c040",
  BUILDER: "#9fc5f0",
};
const DEFAULT_COLOR = "#8faabe";
const FLOOR_SLAB_COLOR = "#607d8b";
const ROOF_COLOR = "#37474f";
const COMMON_AREA_COLOR = "#78909c";
const PASSAGE_COLOR = "#4ade80"; // green for common passage
const VOID_COLOR = "#ef4444"; // red for void outline

// Room name → emoji for floor plan labels
const ROAD_COLOR = "#6b7280"; // asphalt grey
const GRASS_COLOR = "#4ade80"; // bright green grass
const TREE_TRUNK_COLOR = "#92400e"; // brown trunk
const TREE_CANOPY_COLORS = ["#16a34a", "#15803d", "#22c55e", "#166534"]; // varied greens

const ROOM_ICONS: Record<string, string> = {
  Hall: "🛋️",
  Kitchen: "🍳",
  "Bed 1": "🛏️",
  "Bed 2": "🛏️",
  "Bath 1": "🚿",
  "Bath 2": "🚿",
  Balcony: "🌿",
  Passage: "🚪",
};

// ═══════════════════════════════════════════════════════════
//  TREE — simple low-poly tree (cone canopy + cylinder trunk)
// ═══════════════════════════════════════════════════════════
const Tree = ({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) => {
  const colorIdx = useMemo(
    () => Math.floor(Math.random() * TREE_CANOPY_COLORS.length),
    [],
  );
  const trunkH = 0.25 * scale;
  const canopyH = 0.5 * scale;
  const canopyR = 0.2 * scale;
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, trunkH / 2, 0]}>
        <cylinderGeometry args={[0.04 * scale, 0.06 * scale, trunkH, 6]} />
        <meshPhysicalMaterial
          color={TREE_TRUNK_COLOR}
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, trunkH + canopyH / 2, 0]}>
        <coneGeometry args={[canopyR, canopyH, 7]} />
        <meshPhysicalMaterial
          color={TREE_CANOPY_COLORS[colorIdx]}
          roughness={0.7}
          metalness={0.05}
          clearcoat={0.1}
        />
      </mesh>
    </group>
  );
};

// ═══════════════════════════════════════════════════════════
//  FLAT MESH — one clickable box per unit (3D Building View)
// ═══════════════════════════════════════════════════════════
interface FlatMeshProps {
  layout: LayoutUnit;
  floorIndex: number;
  floorHeight: number;
  flatInfo: FlatInfo | undefined;
  isSelected: boolean;
  onSelect: (info: FlatInfo | null) => void;
  dimmed: boolean; // for dimming non-hovered floors
}

const FlatMesh = ({
  layout,
  floorIndex,
  floorHeight,
  flatInfo,
  isSelected,
  onSelect,
  dimmed,
}: FlatMeshProps) => {
  const [hovered, setHovered] = useState(false);

  const status = flatInfo?.status ?? "";
  const baseColor = STATUS_COLORS[status] ?? DEFAULT_COLOR;
  const hoverColor = HOVER_COLORS[status] ?? "#c8d6e5";

  const w = layout.size[0] * S;
  const h = floorHeight * S * 0.85;
  const d = layout.size[1] * S;

  const x = layout.position[0] * S;
  const y = floorIndex * floorHeight * S + h / 2;
  const z = layout.position[1] * S;

  return (
    <mesh
      position={[x, y, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (flatInfo) onSelect(isSelected ? null : flatInfo);
      }}
    >
      <boxGeometry args={[w, h, d]} />
      <meshPhysicalMaterial
        color={isSelected ? "#3b82f6" : hovered ? hoverColor : baseColor}
        transparent={dimmed}
        opacity={dimmed ? 0.2 : 1}
        roughness={0.15}
        metalness={0.35}
        clearcoat={0.6}
        clearcoatRoughness={0.15}
        reflectivity={0.8}
        envMapIntensity={1.0}
      />
      <Edges
        threshold={15}
        color={dimmed ? "#cbd5e1" : "#263238"}
        lineWidth={dimmed ? 0.3 : 0.6}
      />
    </mesh>
  );
};

// ═══════════════════════════════════════════════════════════
//  FLAT SLAB — thin slab per-flat (matches each flat footprint)
// ═══════════════════════════════════════════════════════════
interface FlatSlabProps {
  layout: LayoutUnit;
  floorIndex: number;
  floorHeight: number;
  dimmed?: boolean;
}

const FlatSlab = ({
  layout,
  floorIndex,
  floorHeight,
  dimmed,
}: FlatSlabProps) => {
  const w = layout.size[0] * S;
  const d = layout.size[1] * S;
  const x = layout.position[0] * S;
  const y = floorIndex * floorHeight * S - 0.04;
  const z = layout.position[1] * S;

  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, 0.08, d]} />
      <meshPhysicalMaterial
        color={FLOOR_SLAB_COLOR}
        roughness={0.3}
        metalness={0.25}
        clearcoat={0.3}
        clearcoatRoughness={0.2}
        transparent={!!dimmed}
        opacity={dimmed ? 0.15 : 1}
      />
      <Edges threshold={15} color="#455a64" lineWidth={0.5} />
    </mesh>
  );
};

// ═══════════════════════════════════════════════════════════
//  ROOM MESH — individual room in floor plan view
// ═══════════════════════════════════════════════════════════
interface RoomMeshProps {
  room: Room;
  flatPosition: [number, number]; // parent flat position
  hovered: boolean;
  onHover: (name: string | null) => void;
}

const RoomMesh = ({ room, flatPosition, hovered, onHover }: RoomMeshProps) => {
  const w = room.size[0] * ROOM_S;
  const d = room.size[1] * ROOM_S;
  const x = (flatPosition[0] + room.position[0]) * ROOM_S;
  const z = (flatPosition[1] + room.position[1]) * ROOM_S;
  const color = room.color ?? "#f8f9fa";
  const icon = ROOM_ICONS[room.name] ?? "";

  return (
    <group>
      <mesh
        position={[x, 0.04, z]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(room.name);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
      >
        <boxGeometry args={[w, 0.06, d]} />
        <meshPhysicalMaterial
          color={hovered ? "#dbeafe" : color}
          roughness={0.4}
          metalness={0.05}
          clearcoat={0.1}
        />
        <Edges threshold={15} color="#64748b" lineWidth={0.8} />
      </mesh>
      <Text
        position={[x, 0.1, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={Math.min(w, d) * 0.15}
        color="#334155"
        anchorX="center"
        anchorY="middle"
        fontWeight={500}
        maxWidth={w * 0.9}
      >
        {`${icon} ${room.name}`}
      </Text>
      {/* Dimension label */}
      <Text
        position={[x, 0.1, z + d * 0.38]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={Math.min(w, d) * 0.1}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {`${room.size[0]}'×${room.size[1]}'`}
      </Text>
    </group>
  );
};

// ═══════════════════════════════════════════════════════════
//  FLAT OUTLINE — outer boundary of flat in floor plan
// ═══════════════════════════════════════════════════════════
interface FlatOutlineProps {
  layout: LayoutUnit;
  flatInfo: FlatInfo | undefined;
  isSelected: boolean;
  onSelect: (info: FlatInfo | null) => void;
}

const FlatOutline = ({
  layout,
  flatInfo,
  isSelected,
  onSelect,
}: FlatOutlineProps) => {
  const w = layout.size[0] * ROOM_S;
  const d = layout.size[1] * ROOM_S;
  const x = layout.position[0] * ROOM_S;
  const z = layout.position[1] * ROOM_S;
  const status = flatInfo?.status ?? "";
  const statusColor = status === "OWNER" ? "#e6a817" : "#7ca6d8";

  return (
    <group>
      {/* Flat boundary */}
      <mesh
        position={[x, -0.01, z]}
        onClick={(e) => {
          e.stopPropagation();
          if (flatInfo) onSelect(isSelected ? null : flatInfo);
        }}
      >
        <boxGeometry args={[w, 0.02, d]} />
        <meshPhysicalMaterial
          color={isSelected ? "#3b82f6" : statusColor}
          transparent
          opacity={0.3}
          roughness={0.3}
          metalness={0.05}
        />
        <Edges
          threshold={15}
          color={isSelected ? "#2563eb" : "#1e293b"}
          lineWidth={isSelected ? 2 : 1.5}
        />
      </mesh>
      {/* Flat number label at top-left of flat */}
      <Text
        position={[x - w / 2 + 0.15, 0.15, z - d / 2 + 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.12}
        color={isSelected ? "#2563eb" : "#1e293b"}
        anchorX="left"
        anchorY="top"
        fontWeight={700}
      >
        {flatInfo?.flatNo ?? "—"}
      </Text>
      {/* Status badge */}
      <Text
        position={[x + w / 2 - 0.15, 0.15, z - d / 2 + 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.08}
        color={status === "OWNER" ? "#a16207" : "#64748b"}
        anchorX="right"
        anchorY="top"
        fontWeight={600}
      >
        {status}
      </Text>
    </group>
  );
};

// ═══════════════════════════════════════════════════════════
//  CAMERA CONTROLLER
// ═══════════════════════════════════════════════════════════
type ViewType = "isometric" | "top" | "front" | "side";

interface CameraControllerProps {
  view: ViewType;
  buildingCenter: [number, number, number];
  radius: number;
}

const CameraController = ({
  view,
  buildingCenter,
  radius,
}: CameraControllerProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const r = radius * 1.6;
    const [cx, cy, cz] = buildingCenter;
    let pos: THREE.Vector3;

    switch (view) {
      case "top":
        pos = new THREE.Vector3(cx, cy + r * 1.8, cz + 0.01);
        break;
      case "front":
        pos = new THREE.Vector3(cx, cy, cz + r * 1.5);
        break;
      case "side":
        pos = new THREE.Vector3(cx + r * 1.5, cy, cz);
        break;
      case "isometric":
      default:
        pos = new THREE.Vector3(cx + r * 0.8, cy + r * 0.7, cz + r * 0.8);
        break;
    }

    camera.position.copy(pos);
    camera.lookAt(cx, cy, cz);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(cx, cy, cz);
      controlsRef.current.update();
    }
  }, [view, buildingCenter, radius, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1}
      maxDistance={radius * 5}
      target={buildingCenter}
    />
  );
};

// ═══════════════════════════════════════════════════════════
//  SCENE SETUP — background, fog (reactive to view changes)
// ═══════════════════════════════════════════════════════════
const SceneSetup = ({ isFloorPlan }: { isFloorPlan: boolean }) => {
  const { scene } = useThree();
  useEffect(() => {
    if (!isFloorPlan) {
      scene.background = new THREE.Color("#dbeafe");
      scene.fog = new THREE.Fog("#dbeafe", 25, 70);
    } else {
      scene.background = null;
      scene.fog = null;
    }
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [isFloorPlan, scene]);
  return null;
};

// ═══════════════════════════════════════════════════════════
//  RESIZE HANDLER — forces canvas to resize on mount/expand
// ═══════════════════════════════════════════════════════════
const ResizeHandler = ({ isExpanded }: { isExpanded: boolean }) => {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    // Force resize after a small delay to let the DOM settle
    const timer = setTimeout(() => {
      // Dispatch a resize event to trigger R3F's internal resize logic
      window.dispatchEvent(new Event("resize"));
      invalidate();
    }, 100);

    return () => clearTimeout(timer);
  }, [isExpanded, gl, invalidate]);

  // Also trigger on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      invalidate();
    }, 150);
    return () => clearTimeout(timer);
  }, [invalidate]);

  return null;
};

// ═══════════════════════════════════════════════════════════
//  FLOOR PLAN SCENE — top-down 2D view of a single floor
// ═══════════════════════════════════════════════════════════
interface FloorPlanSceneProps {
  config: BuildingConfig;
  floorNum: number;
  selectedFlat: FlatInfo | null;
  onSelectFlat: (info: FlatInfo | null) => void;
}

const FloorPlanScene = ({
  config,
  floorNum,
  selectedFlat,
  onSelectFlat,
}: FloorPlanSceneProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const { typicalLayout, flatData } = config;

  const flatMap = useMemo(() => {
    const map = new Map<string, FlatInfo>();
    for (const f of flatData) map.set(f.flatNo, f);
    return map;
  }, [flatData]);

  // Compute center for camera
  const { centerX, centerZ, maxExtent, fpLeft, fpRight, fpFront, fpBack } =
    useMemo(() => {
      let minX = Infinity,
        maxX = -Infinity,
        minZ = Infinity,
        maxZ = -Infinity;
      for (const u of typicalLayout) {
        const x1 = (u.position[0] - u.size[0] / 2) * ROOM_S;
        const x2 = (u.position[0] + u.size[0] / 2) * ROOM_S;
        const z1 = (u.position[1] - u.size[1] / 2) * ROOM_S;
        const z2 = (u.position[1] + u.size[1] / 2) * ROOM_S;
        minX = Math.min(minX, x1);
        maxX = Math.max(maxX, x2);
        minZ = Math.min(minZ, z1);
        maxZ = Math.max(maxZ, z2);
      }
      return {
        centerX: (minX + maxX) / 2,
        centerZ: (minZ + maxZ) / 2,
        maxExtent: Math.max(maxX - minX, maxZ - minZ),
        fpLeft: minX,
        fpRight: maxX,
        fpFront: minZ,
        fpBack: maxZ,
      };
    }, [typicalLayout]);

  // Set top-down camera
  useEffect(() => {
    const dist = maxExtent * 1.35; // wider to show roads & trees
    camera.position.set(centerX, dist, centerZ + 0.01);
    camera.lookAt(centerX, 0, centerZ);
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(centerX, 0, centerZ);
      controlsRef.current.update();
    }
  }, [camera, centerX, centerZ, maxExtent]);

  return (
    <>
      <hemisphereLight args={["#ffffff", "#94a3b8", 0.7]} />
      <directionalLight position={[0, 20, 0]} intensity={0.5} />

      {/* Floor title */}
      <Text
        position={[centerX, 0.3, centerZ - maxExtent * 0.6]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.18}
        color="#1e293b"
        anchorX="center"
        fontWeight={700}
      >
        {`Floor ${floorNum} — ${config.buildingName}`}
      </Text>

      {/* Render each flat */}
      {typicalLayout.map((unit) => {
        const flatNo = `${floorNum}${unit.unitSuffix}`;
        const flatInfo = flatMap.get(flatNo);
        const isSelected = selectedFlat?.flatNo === flatNo;

        return (
          <group key={flatNo}>
            {/* Flat outer boundary */}
            <FlatOutline
              layout={unit}
              flatInfo={flatInfo}
              isSelected={isSelected}
              onSelect={onSelectFlat}
            />

            {/* Rooms inside the flat */}
            {unit.rooms.map((room, ri) => (
              <RoomMesh
                key={`${flatNo}-room-${ri}`}
                room={room}
                flatPosition={unit.position}
                hovered={hoveredRoom === room.name}
                onHover={setHoveredRoom}
              />
            ))}
          </group>
        );
      })}

      {/* Render common areas (staircase / lift / lobby / ducts) */}
      {config.commonAreas?.map((area, i) => {
        const [ax, az] = area.position;
        const [aw, ad] = area.size;
        const areaColor = area.color ?? COMMON_AREA_COLOR;
        const nm = area.name.toLowerCase();
        const isLift = nm.includes("lift");
        const isLobby =
          nm.includes("lobby") ||
          nm.includes("corridor") ||
          nm.includes("passage");
        const isStair = nm.includes("stair");
        const isDuct = nm.includes("duct");
        const isRefuge = nm.includes("refuge");
        const icon = isLift
          ? "🛗"
          : isLobby
            ? "🏢"
            : isStair
              ? "🪜"
              : isDuct
                ? "🔲"
                : isRefuge
                  ? "🛟"
                  : "🚶";
        return (
          <group key={`fp-common-${i}`}>
            {/* filled rectangle */}
            <mesh
              position={[ax * ROOM_S, 0.001, az * ROOM_S]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[aw * ROOM_S, ad * ROOM_S]} />
              <meshBasicMaterial color={areaColor} transparent opacity={0.45} />
            </mesh>
            {/* outline */}
            <lineSegments
              position={[ax * ROOM_S, 0.002, az * ROOM_S]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <edgesGeometry
                args={[new THREE.PlaneGeometry(aw * ROOM_S, ad * ROOM_S)]}
              />
              <lineBasicMaterial color={areaColor} />
            </lineSegments>
            {/* label */}
            <Text
              position={[ax * ROOM_S, 0.003, az * ROOM_S]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={Math.min(aw, ad) * ROOM_S * 0.18}
              color={areaColor}
              anchorX="center"
              anchorY="middle"
              fontWeight={700}
              maxWidth={aw * ROOM_S * 0.9}
            >
              {`${icon} ${area.name}`}
            </Text>
            {/* Size label */}
            <Text
              position={[ax * ROOM_S, 0.003, az * ROOM_S + ad * ROOM_S * 0.35]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={Math.min(aw, ad) * ROOM_S * 0.12}
              color="#64748b"
              anchorX="center"
              anchorY="middle"
            >
              {`${aw}'×${ad}'`}
            </Text>
          </group>
        );
      })}

      {/* Render passage (covered corridor) */}
      {config.passage &&
        (() => {
          const p = config.passage;
          const [px, pz] = p.position;
          const [pw, pd] = p.size;
          return (
            <group key="fp-passage">
              {/* filled rectangle */}
              <mesh
                position={[px * ROOM_S, 0.001, pz * ROOM_S]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[pw * ROOM_S, pd * ROOM_S]} />
                <meshBasicMaterial
                  color={PASSAGE_COLOR}
                  transparent
                  opacity={0.25}
                />
              </mesh>
              {/* outline */}
              <lineSegments
                position={[px * ROOM_S, 0.002, pz * ROOM_S]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <edgesGeometry
                  args={[new THREE.PlaneGeometry(pw * ROOM_S, pd * ROOM_S)]}
                />
                <lineBasicMaterial color="#22c55e" />
              </lineSegments>
              {/* label */}
              <Text
                position={[px * ROOM_S, 0.003, pz * ROOM_S]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.08}
                color="#16a34a"
                anchorX="center"
                anchorY="middle"
                fontWeight={700}
              >
                {"🚶 Passage"}
              </Text>
            </group>
          );
        })()}

      {/* Render void (empty open-air shaft) — dashed outline only, no fill */}
      {config.void &&
        (() => {
          const v = config.void;
          const [vx, vz] = v.position;
          const [vw, vd] = v.size;
          return (
            <group key="fp-void">
              {/* dashed outline */}
              <lineSegments
                position={[vx * ROOM_S, 0.002, vz * ROOM_S]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <edgesGeometry
                  args={[new THREE.PlaneGeometry(vw * ROOM_S, vd * ROOM_S)]}
                />
                <lineDashedMaterial
                  color={VOID_COLOR}
                  dashSize={0.06}
                  gapSize={0.04}
                  linewidth={1}
                />
              </lineSegments>
              {/* diagonal cross lines to show "empty" */}
              <Line
                points={[
                  [
                    vx * ROOM_S - (vw * ROOM_S) / 2,
                    0.002,
                    vz * ROOM_S - (vd * ROOM_S) / 2,
                  ],
                  [
                    vx * ROOM_S + (vw * ROOM_S) / 2,
                    0.002,
                    vz * ROOM_S + (vd * ROOM_S) / 2,
                  ],
                ]}
                color={VOID_COLOR}
                lineWidth={1}
                transparent
                opacity={0.35}
              />
              <Line
                points={[
                  [
                    vx * ROOM_S + (vw * ROOM_S) / 2,
                    0.002,
                    vz * ROOM_S - (vd * ROOM_S) / 2,
                  ],
                  [
                    vx * ROOM_S - (vw * ROOM_S) / 2,
                    0.002,
                    vz * ROOM_S + (vd * ROOM_S) / 2,
                  ],
                ]}
                color={VOID_COLOR}
                lineWidth={1}
                transparent
                opacity={0.35}
              />
              {/* label */}
              <Text
                position={[vx * ROOM_S, 0.003, vz * ROOM_S]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.08}
                color={VOID_COLOR}
                anchorX="center"
                anchorY="middle"
                fontWeight={700}
              >
                {"⬜ Void (Open Air)"}
              </Text>
            </group>
          );
        })()}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  FLOOR-PLAN ENVIRONMENT — Roads, Grass, Trees (top-down)  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {(() => {
        const roadW = 0.5; // road strip width in floor-plan scale
        const grassW = 0.3; // grass strip
        const extX = fpRight - fpLeft;
        const extZ = fpBack - fpFront;
        const y = -0.001; // below flats

        return (
          <group key="fp-env">
            {/* Front road */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[centerX, y, fpFront - grassW - roadW / 2]}
            >
              <planeGeometry args={[extX + 2, roadW]} />
              <meshBasicMaterial color={ROAD_COLOR} />
            </mesh>
            {/* Front road centre dashes */}
            <Line
              points={[
                [fpLeft - 1, y + 0.001, fpFront - grassW - roadW / 2],
                [fpRight + 1, y + 0.001, fpFront - grassW - roadW / 2],
              ]}
              color="#fbbf24"
              lineWidth={1.5}
              dashed
              dashSize={0.12}
              gapSize={0.06}
            />
            {/* Front road label */}
            <Text
              position={[centerX, y + 0.002, fpFront - grassW - roadW - 0.15]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.07}
              color="#374151"
              anchorX="center"
              fontWeight={600}
            >
              {"🛣️ Main Road"}
            </Text>

            {/* Left side road */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[fpLeft - grassW - roadW / 2, y, centerZ]}
            >
              <planeGeometry args={[roadW, extZ + 2]} />
              <meshBasicMaterial color={ROAD_COLOR} />
            </mesh>
            {/* Left road centre dashes */}
            <Line
              points={[
                [fpLeft - grassW - roadW / 2, y + 0.001, fpFront - 1],
                [fpLeft - grassW - roadW / 2, y + 0.001, fpBack + 1],
              ]}
              color="#fbbf24"
              lineWidth={1.5}
              dashed
              dashSize={0.12}
              gapSize={0.06}
            />
            {/* Side road label */}
            <Text
              position={[fpLeft - grassW - roadW - 0.15, y + 0.002, centerZ]}
              rotation={[-Math.PI / 2, 0, Math.PI / 2]}
              fontSize={0.06}
              color="#374151"
              anchorX="center"
              fontWeight={600}
            >
              {"🛣️ Side Road"}
            </Text>

            {/* Grass strips */}
            {/* Front grass */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[centerX, y - 0.001, fpFront - grassW / 2]}
            >
              <planeGeometry args={[extX + 1, grassW]} />
              <meshBasicMaterial
                color={GRASS_COLOR}
                transparent
                opacity={0.5}
              />
            </mesh>
            {/* Left grass */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[fpLeft - grassW / 2, y - 0.001, centerZ]}
            >
              <planeGeometry args={[grassW, extZ + 1]} />
              <meshBasicMaterial
                color={GRASS_COLOR}
                transparent
                opacity={0.5}
              />
            </mesh>
            {/* Right grass */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[fpRight + grassW / 2, y - 0.001, centerZ]}
            >
              <planeGeometry args={[grassW, extZ + 1]} />
              <meshBasicMaterial
                color={GRASS_COLOR}
                transparent
                opacity={0.5}
              />
            </mesh>
            {/* Back grass */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[centerX, y - 0.001, fpBack + grassW / 2]}
            >
              <planeGeometry args={[extX + 1, grassW]} />
              <meshBasicMaterial
                color={GRASS_COLOR}
                transparent
                opacity={0.5}
              />
            </mesh>

            {/* Tree circles (top-down = small green filled circles) */}
            {/* Front trees */}
            {Array.from({ length: 7 }, (_, i) => {
              const xp = fpLeft + 0.2 + (i + 0.5) * (extX / 7);
              const zp = fpFront - grassW / 2;
              return (
                <mesh
                  key={`fpt-front-${i}`}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[xp, y + 0.001, zp]}
                >
                  <circleGeometry args={[0.08, 12]} />
                  <meshBasicMaterial color="#16a34a" />
                </mesh>
              );
            })}
            {/* Left trees */}
            {Array.from({ length: 5 }, (_, i) => {
              const xp = fpLeft - grassW / 2;
              const zp = fpFront + 0.3 + (i + 0.5) * ((extZ - 0.6) / 5);
              return (
                <mesh
                  key={`fpt-left-${i}`}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[xp, y + 0.001, zp]}
                >
                  <circleGeometry args={[0.07, 12]} />
                  <meshBasicMaterial color="#15803d" />
                </mesh>
              );
            })}
            {/* Right trees */}
            {Array.from({ length: 5 }, (_, i) => {
              const xp = fpRight + grassW / 2;
              const zp = fpFront + 0.3 + (i + 0.5) * ((extZ - 0.6) / 5);
              return (
                <mesh
                  key={`fpt-right-${i}`}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[xp, y + 0.001, zp]}
                >
                  <circleGeometry args={[0.07, 12]} />
                  <meshBasicMaterial color="#22c55e" />
                </mesh>
              );
            })}
            {/* Back trees */}
            {Array.from({ length: 5 }, (_, i) => {
              const xp = fpLeft + 0.3 + (i + 0.5) * ((extX - 0.6) / 5);
              const zp = fpBack + grassW / 2;
              return (
                <mesh
                  key={`fpt-back-${i}`}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[xp, y + 0.001, zp]}
                >
                  <circleGeometry args={[0.07, 12]} />
                  <meshBasicMaterial color="#166534" />
                </mesh>
              );
            })}

            {/* Entrance gate marker */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[centerX, y + 0.003, fpFront - 0.05]}
            >
              <planeGeometry args={[0.3, 0.08]} />
              <meshBasicMaterial color="#78716c" />
            </mesh>
            <Text
              position={[centerX, y + 0.004, fpFront - 0.12]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.045}
              color="#44403c"
              anchorX="center"
              fontWeight={700}
            >
              {"🚪 Entrance"}
            </Text>
          </group>
        );
      })()}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enableRotate={true}
        minDistance={0.5}
        maxDistance={maxExtent * 3}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════
//  BUILDING SCENE — the full 3D scene
// ═══════════════════════════════════════════════════════════
interface BuildingSceneProps {
  config: BuildingConfig;
  selectedFlat: FlatInfo | null;
  onSelectFlat: (info: FlatInfo | null) => void;
  view: ViewType;
  highlightFloor: number | null; // hovered floor
  onClickFloor: (floor: number) => void;
}

const BuildingScene = ({
  config,
  selectedFlat,
  onSelectFlat,
  view,
  highlightFloor,
  onClickFloor,
}: BuildingSceneProps) => {
  const { totalFloors, floorHeight, typicalLayout, flatData } = config;

  const { extentX, extentZ, buildingCenter, radius, centerX, centerZ } =
    useMemo(() => {
      let minX = Infinity,
        maxX = -Infinity,
        minZ = Infinity,
        maxZ = -Infinity;
      for (const u of typicalLayout) {
        const x1 = (u.position[0] - u.size[0] / 2) * S;
        const x2 = (u.position[0] + u.size[0] / 2) * S;
        const z1 = (u.position[1] - u.size[1] / 2) * S;
        const z2 = (u.position[1] + u.size[1] / 2) * S;
        minX = Math.min(minX, x1);
        maxX = Math.max(maxX, x2);
        minZ = Math.min(minZ, z1);
        maxZ = Math.max(maxZ, z2);
      }
      const eX = maxX - minX;
      const eZ = maxZ - minZ;
      const bH = totalFloors * floorHeight * S;
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      const r = Math.max(eX, eZ, bH) * 1.2;
      return {
        extentX: eX,
        extentZ: eZ,
        buildingCenter: [cx, bH / 2, cz] as [number, number, number],
        radius: r,
        centerX: cx,
        centerZ: cz,
      };
    }, [typicalLayout, totalFloors, floorHeight]);

  const flatMap = useMemo(() => {
    const map = new Map<string, FlatInfo>();
    for (const f of flatData) map.set(f.flatNo, f);
    return map;
  }, [flatData]);

  const totalH = totalFloors * floorHeight * S;

  return (
    <>
      <hemisphereLight args={["#ffffff", "#4a6270", 0.8]} />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[15, 25, 15]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-10, 15, -10]} intensity={0.5} />
      <directionalLight position={[5, 10, -15]} intensity={0.3} />
      <Environment preset="city" />

      {/* Ground (larger to fit roads + greenery) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.1, centerZ]}
        receiveShadow
      >
        <planeGeometry args={[extentX + 16, extentZ + 16]} />
        <meshPhysicalMaterial
          color="#c8d6e0"
          roughness={0.7}
          metalness={0.05}
          clearcoat={0.1}
        />
      </mesh>
      <gridHelper
        args={[Math.max(extentX, extentZ) + 16, 32, "#cbd5e1", "#e2e8f0"]}
        position={[centerX, -0.09, centerZ]}
      />

      {/* Building name */}
      <Text
        position={[centerX, totalH + 0.6, centerZ]}
        fontSize={0.3}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        {config.buildingName}
      </Text>

      {/* === FLOOR LOOP === */}
      {Array.from({ length: totalFloors }, (_, floorIdx) => {
        const floorNum = floorIdx + 1;
        const isDimmed = highlightFloor !== null && highlightFloor !== floorNum;

        return (
          <group key={`floor-${floorNum}`}>
            {/* Per-flat floor slabs (only under each flat, not full rectangle) */}
            {typicalLayout.map((unit) => (
              <FlatSlab
                key={`slab-${floorNum}-${unit.unitSuffix}`}
                layout={unit}
                floorIndex={floorIdx}
                floorHeight={floorHeight}
                dimmed={isDimmed}
              />
            ))}

            {/* Floor label — clickable */}
            <Text
              position={[
                centerX - extentX / 2 - 0.6,
                floorIdx * floorHeight * S + (floorHeight * S * 0.85) / 2,
                centerZ,
              ]}
              fontSize={0.18}
              color={highlightFloor === floorNum ? "#3b82f6" : "#64748b"}
              anchorX="right"
              anchorY="middle"
              fontWeight={highlightFloor === floorNum ? 700 : 400}
              onClick={(e) => {
                e.stopPropagation();
                onClickFloor(floorNum);
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              {`Floor ${floorNum} →`}
            </Text>

            {typicalLayout.map((unit) => {
              const flatNo = `${floorNum}${unit.unitSuffix}`;
              const flatInfo = flatMap.get(flatNo);
              return (
                <FlatMesh
                  key={flatNo}
                  layout={unit}
                  floorIndex={floorIdx}
                  floorHeight={floorHeight}
                  flatInfo={flatInfo}
                  isSelected={selectedFlat?.flatNo === flatNo}
                  onSelect={onSelectFlat}
                  dimmed={isDimmed}
                />
              );
            })}

            {/* Common areas (staircase, lift) per floor */}
            {config.commonAreas?.map((area, ai) => {
              const w = area.size[0] * S;
              const h = floorHeight * S * 0.85;
              const d = area.size[1] * S;
              const x = area.position[0] * S;
              const y = floorIdx * floorHeight * S + h / 2;
              const z = area.position[1] * S;
              const areaColor = area.color ?? COMMON_AREA_COLOR;
              return (
                <mesh key={`common-${floorNum}-${ai}`} position={[x, y, z]}>
                  <boxGeometry args={[w, h, d]} />
                  <meshPhysicalMaterial
                    color={areaColor}
                    transparent
                    opacity={isDimmed ? 0.15 : 0.55}
                    roughness={0.1}
                    metalness={0.05}
                    transmission={isDimmed ? 0 : 0.5}
                    thickness={0.5}
                    clearcoat={0.3}
                    clearcoatRoughness={0.2}
                  />
                  <Edges
                    threshold={15}
                    color={isDimmed ? "#cbd5e1" : "#64748b"}
                    lineWidth={isDimmed ? 0.3 : 0.8}
                  />
                </mesh>
              );
            })}

            {/* Passage (covered corridor) per floor */}
            {config.passage &&
              (() => {
                const p = config.passage;
                const w = p.size[0] * S;
                const h = floorHeight * S * 0.85;
                const d = p.size[1] * S;
                const x = p.position[0] * S;
                const y = floorIdx * floorHeight * S + h / 2;
                const z = p.position[1] * S;
                return (
                  <group>
                    {/* Passage walls */}
                    <mesh key={`passage-${floorNum}`} position={[x, y, z]}>
                      <boxGeometry args={[w, h, d]} />
                      <meshPhysicalMaterial
                        color={PASSAGE_COLOR}
                        transparent
                        opacity={isDimmed ? 0.08 : 0.25}
                        roughness={0.1}
                        metalness={0.05}
                        transmission={isDimmed ? 0 : 0.5}
                        thickness={0.5}
                        clearcoat={0.3}
                        clearcoatRoughness={0.2}
                      />
                      <Edges
                        threshold={15}
                        color={isDimmed ? "#cbd5e1" : "#22c55e"}
                        lineWidth={isDimmed ? 0.3 : 0.8}
                      />
                    </mesh>
                    {/* Passage floor slab */}
                    <mesh position={[x, floorIdx * floorHeight * S, z]}>
                      <boxGeometry args={[w, 0.06, d]} />
                      <meshPhysicalMaterial
                        color="#64748b"
                        roughness={0.4}
                        metalness={0.1}
                        clearcoat={0.15}
                      />
                      <Edges threshold={15} color="#475569" lineWidth={0.3} />
                    </mesh>
                  </group>
                );
              })()}

            {/* Void — empty open-air shaft, NO geometry rendered */}
          </group>
        );
      })}

      {/* Roof — per-flat slabs (matches flat footprints only) */}
      {typicalLayout.map((unit) => {
        const w = unit.size[0] * S;
        const d = unit.size[1] * S;
        const x = unit.position[0] * S;
        const z = unit.position[1] * S;
        return (
          <mesh
            key={`roof-${unit.unitSuffix}`}
            position={[x, totalH + 0.02, z]}
          >
            <boxGeometry args={[w, 0.12, d]} />
            <meshPhysicalMaterial
              color={ROOF_COLOR}
              roughness={0.15}
              metalness={0.45}
              clearcoat={0.5}
              clearcoatRoughness={0.1}
              reflectivity={0.9}
            />
            <Edges threshold={15} color="#1a2530" lineWidth={0.5} />
          </mesh>
        );
      })}
      {/* Roof for common areas */}
      {config.commonAreas?.map((area, ai) => {
        const w = area.size[0] * S;
        const d = area.size[1] * S;
        const x = area.position[0] * S;
        const z = area.position[1] * S;
        return (
          <mesh key={`roof-common-${ai}`} position={[x, totalH + 0.02, z]}>
            <boxGeometry args={[w, 0.12, d]} />
            <meshPhysicalMaterial
              color={ROOF_COLOR}
              roughness={0.15}
              metalness={0.45}
              clearcoat={0.5}
              clearcoatRoughness={0.1}
              reflectivity={0.9}
            />
            <Edges threshold={15} color="#1a2530" lineWidth={0.5} />
          </mesh>
        );
      })}

      {/* Roof for passage (covered corridor gets a roof) */}
      {config.passage &&
        (() => {
          const p = config.passage;
          const w = p.size[0] * S;
          const d = p.size[1] * S;
          const x = p.position[0] * S;
          const z = p.position[1] * S;
          return (
            <mesh key="roof-passage" position={[x, totalH + 0.02, z]}>
              <boxGeometry args={[w, 0.12, d]} />
              <meshPhysicalMaterial
                color={ROOF_COLOR}
                roughness={0.3}
                metalness={0.2}
                clearcoat={0.3}
                clearcoatRoughness={0.2}
              />
              <Edges threshold={15} color="#334155" lineWidth={0.5} />
            </mesh>
          );
        })()}

      {/* NO roof for void — open-air shaft from ground to sky */}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  SURROUNDING ENVIRONMENT — Roads, Greenery & Trees        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {(() => {
        // Building footprint edges (in Three.js world coords)
        const bLeft = centerX - extentX / 2;
        const bRight = centerX + extentX / 2;
        const bFront = centerZ - extentZ / 2; // south / front (negative Z)
        const bBack = centerZ + extentZ / 2; // north / back

        const roadW = 1.2; // road width
        const grassW = 0.8; // grass strip width between road & building
        const y = -0.08; // just above ground

        return (
          <group key="environment">
            {/* ─── FRONT ROAD (south side, runs along X) ─── */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[centerX, y, bFront - grassW - roadW / 2]}
            >
              <planeGeometry args={[extentX + 6, roadW]} />
              <meshPhysicalMaterial
                color={ROAD_COLOR}
                roughness={0.6}
                metalness={0.05}
                clearcoat={0.1}
              />
            </mesh>
            {/* Road centre line */}
            <Line
              points={[
                [bLeft - 3, y + 0.01, bFront - grassW - roadW / 2],
                [bRight + 3, y + 0.01, bFront - grassW - roadW / 2],
              ]}
              color="#fbbf24"
              lineWidth={2}
              dashed
              dashSize={0.3}
              gapSize={0.15}
            />
            {/* Road edge markings */}
            <Line
              points={[
                [bLeft - 3, y + 0.01, bFront - grassW],
                [bRight + 3, y + 0.01, bFront - grassW],
              ]}
              color="#ffffff"
              lineWidth={1}
            />
            <Line
              points={[
                [bLeft - 3, y + 0.01, bFront - grassW - roadW],
                [bRight + 3, y + 0.01, bFront - grassW - roadW],
              ]}
              color="#ffffff"
              lineWidth={1}
            />

            {/* ─── LEFT SIDE ROAD (west side, runs along Z) ─── */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[bLeft - grassW - roadW / 2, y, centerZ]}
            >
              <planeGeometry args={[roadW, extentZ + 6]} />
              <meshPhysicalMaterial
                color={ROAD_COLOR}
                roughness={0.6}
                metalness={0.05}
                clearcoat={0.1}
              />
            </mesh>
            {/* Road centre line */}
            <Line
              points={[
                [bLeft - grassW - roadW / 2, y + 0.01, bFront - 3],
                [bLeft - grassW - roadW / 2, y + 0.01, bBack + 3],
              ]}
              color="#fbbf24"
              lineWidth={2}
              dashed
              dashSize={0.3}
              gapSize={0.15}
            />

            {/* ─── FRONT GRASS STRIP (between building & front road) ─── */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[centerX, y - 0.01, bFront - grassW / 2]}
            >
              <planeGeometry args={[extentX + 2, grassW]} />
              <meshPhysicalMaterial
                color={GRASS_COLOR}
                roughness={0.9}
                metalness={0}
              />
            </mesh>

            {/* ─── LEFT GRASS STRIP (between building & side road) ─── */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[bLeft - grassW / 2, y - 0.01, centerZ]}
            >
              <planeGeometry args={[grassW, extentZ + 2]} />
              <meshPhysicalMaterial
                color={GRASS_COLOR}
                roughness={0.9}
                metalness={0}
              />
            </mesh>

            {/* ─── RIGHT GRASS STRIP ─── */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[bRight + grassW / 2, y - 0.01, centerZ]}
            >
              <planeGeometry args={[grassW, extentZ + 2]} />
              <meshPhysicalMaterial
                color={GRASS_COLOR}
                roughness={0.9}
                metalness={0}
              />
            </mesh>

            {/* ─── BACK GRASS STRIP ─── */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[centerX, y - 0.01, bBack + grassW / 2]}
            >
              <planeGeometry args={[extentX + 2, grassW]} />
              <meshPhysicalMaterial
                color={GRASS_COLOR}
                roughness={0.9}
                metalness={0}
              />
            </mesh>

            {/* ─── FRONT TREES (along the front road) ─── */}
            {Array.from({ length: 8 }, (_, i) => {
              const xPos = bLeft - 0.5 + (i + 0.5) * ((extentX + 4) / 8);
              const zPos = bFront - grassW / 2;
              const s = 0.7 + Math.random() * 0.5;
              return (
                <Tree
                  key={`tree-front-${i}`}
                  position={[xPos, 0, zPos]}
                  scale={s}
                />
              );
            })}

            {/* ─── LEFT SIDE TREES (along the side road) ─── */}
            {Array.from({ length: 6 }, (_, i) => {
              const xPos = bLeft - grassW / 2;
              const zPos = bFront + 0.5 + (i + 0.5) * ((extentZ - 1) / 6);
              const s = 0.6 + Math.random() * 0.5;
              return (
                <Tree
                  key={`tree-left-${i}`}
                  position={[xPos, 0, zPos]}
                  scale={s}
                />
              );
            })}

            {/* ─── RIGHT SIDE TREES ─── */}
            {Array.from({ length: 6 }, (_, i) => {
              const xPos = bRight + grassW / 2;
              const zPos = bFront + 0.5 + (i + 0.5) * ((extentZ - 1) / 6);
              const s = 0.6 + Math.random() * 0.5;
              return (
                <Tree
                  key={`tree-right-${i}`}
                  position={[xPos, 0, zPos]}
                  scale={s}
                />
              );
            })}

            {/* ─── BACK TREES ─── */}
            {Array.from({ length: 6 }, (_, i) => {
              const xPos = bLeft + 0.5 + (i + 0.5) * ((extentX - 1) / 6);
              const zPos = bBack + grassW / 2;
              const s = 0.7 + Math.random() * 0.4;
              return (
                <Tree
                  key={`tree-back-${i}`}
                  position={[xPos, 0, zPos]}
                  scale={s}
                />
              );
            })}

            {/* ─── FRONT ROAD LABEL ─── */}
            <Text
              position={[centerX, y + 0.02, bFront - grassW - roadW - 0.3]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.15}
              color="#374151"
              anchorX="center"
              fontWeight={600}
            >
              {"🛣️ Main Road"}
            </Text>

            {/* ─── SIDE ROAD LABEL ─── */}
            <Text
              position={[bLeft - grassW - roadW - 0.3, y + 0.02, centerZ]}
              rotation={[-Math.PI / 2, 0, Math.PI / 2]}
              fontSize={0.12}
              color="#374151"
              anchorX="center"
              fontWeight={600}
            >
              {"🛣️ Side Road"}
            </Text>

            {/* ─── ENTRANCE GATE (front center) ─── */}
            {/* Left pillar */}
            <mesh position={[centerX - 0.3, 0.25, bFront - 0.15]}>
              <boxGeometry args={[0.12, 0.5, 0.12]} />
              <meshPhysicalMaterial
                color="#78716c"
                roughness={0.4}
                metalness={0.15}
                clearcoat={0.2}
              />
            </mesh>
            {/* Right pillar */}
            <mesh position={[centerX + 0.3, 0.25, bFront - 0.15]}>
              <boxGeometry args={[0.12, 0.5, 0.12]} />
              <meshPhysicalMaterial
                color="#78716c"
                roughness={0.4}
                metalness={0.15}
                clearcoat={0.2}
              />
            </mesh>
            {/* Gate top beam */}
            <mesh position={[centerX, 0.52, bFront - 0.15]}>
              <boxGeometry args={[0.72, 0.06, 0.14]} />
              <meshPhysicalMaterial
                color="#78716c"
                roughness={0.35}
                metalness={0.2}
                clearcoat={0.25}
              />
            </mesh>
            {/* Gate label */}
            <Text
              position={[centerX, 0.6, bFront - 0.15]}
              fontSize={0.06}
              color="#1e293b"
              anchorX="center"
              fontWeight={700}
            >
              {"ENTRANCE"}
            </Text>
          </group>
        );
      })()}

      <CameraController
        view={view}
        buildingCenter={buildingCenter}
        radius={radius}
      />
      <Environment preset="city" />
    </>
  );
};

// ═══════════════════════════════════════════════════════════
//  FLAT DETAIL OVERLAY
// ═══════════════════════════════════════════════════════════
const FlatDetailOverlay = ({
  flat,
  onClose,
}: {
  flat: FlatInfo;
  onClose: () => void;
}) => (
  <div className="pv-overlay">
    <div className="pv-overlay-card">
      <button className="pv-overlay-close" onClick={onClose}>
        ✕
      </button>
      <h3>Flat {flat.flatNo}</h3>
      <div className="pv-overlay-grid">
        <div className="pv-overlay-item">
          <span className="pv-overlay-label">Type</span>
          <span className="pv-overlay-value">{flat.type}</span>
        </div>
        <div className="pv-overlay-item">
          <span className="pv-overlay-label">Carpet Area</span>
          <span className="pv-overlay-value">{flat.carpet} sq ft</span>
        </div>
        <div className="pv-overlay-item">
          <span className="pv-overlay-label">Built-up Area</span>
          <span className="pv-overlay-value">{flat.buArea} sq ft</span>
        </div>
        <div className="pv-overlay-item">
          <span className="pv-overlay-label">Status</span>
          <span className={`pv-overlay-badge ${flat.status.toLowerCase()}`}>
            {flat.status === "OWNER" ? "🟡 Owner" : "⬜ Builder"}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
interface ParametricViewerProps {
  config?: BuildingConfig;
}

const ParametricViewer = ({ config: propConfig }: ParametricViewerProps) => {
  const [config, setConfig] = useState<BuildingConfig | null>(
    propConfig ?? null,
  );
  const [loading, setLoading] = useState(!propConfig);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlat, setSelectedFlat] = useState<FlatInfo | null>(null);
  const [view, setView] = useState<ViewType>("isometric");
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFloor, setActiveFloor] = useState<number | null>(null); // null = building view, number = floor plan
  const [highlightFloor, setHighlightFloor] = useState<number | null>(null);

  useEffect(() => {
    if (propConfig) {
      setConfig(propConfig);
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const res = await fetch("/data/buildings.json");
        if (!res.ok) throw new Error("Failed to fetch building data");
        const data: BuildingConfig[] = await res.json();
        if (data.length > 0) setConfig(data[0]);
        else throw new Error("No building data found");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propConfig]);

  const handleSelectFlat = useCallback((flat: FlatInfo | null) => {
    setSelectedFlat(flat);
  }, []);

  const handleClickFloor = useCallback((floor: number) => {
    setActiveFloor(floor);
    setSelectedFlat(null);
  }, []);

  const handleBackToBuilding = useCallback(() => {
    setActiveFloor(null);
    setSelectedFlat(null);
  }, []);

  const ownerCount =
    config?.flatData.filter((f) => f.status === "OWNER").length ?? 0;
  const builderCount =
    config?.flatData.filter((f) => f.status === "BUILDER").length ?? 0;
  const totalFlats = config?.flatData.length ?? 0;

  if (loading) {
    return (
      <div className="pv-loading">
        <div className="pv-spinner" />
        <p>Loading building data…</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="pv-error">
        <p>⚠️ {error ?? "No building configuration available."}</p>
      </div>
    );
  }

  const isFloorPlan = activeFloor !== null;

  return (
    <div className={`pv-container ${isExpanded ? "pv-expanded" : ""}`}>
      {/* ─── Header ─── */}
      <div className="pv-header">
        <div className="pv-header-left">
          {isFloorPlan && (
            <button
              className="pv-btn pv-btn-back"
              onClick={handleBackToBuilding}
            >
              ← Back
            </button>
          )}
          <span className="pv-icon">
            <HiOutlineBuildingOffice2 />
          </span>
          <div>
            <h2>
              {isFloorPlan
                ? `Floor ${activeFloor} — Floor Plan`
                : config.buildingName}
            </h2>
            <span className="pv-subtitle">
              {isFloorPlan
                ? `${config.typicalLayout.length} Flats • Click flat for details`
                : `${config.totalFloors} Floors • ${totalFlats} Flats • Click "Floor N →" to see layout`}
            </span>
          </div>
        </div>
        <div className="pv-header-right">
          <button
            className="pv-btn pv-btn-ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <HiOutlineArrowsPointingIn /> Collapse
              </>
            ) : (
              <>
                <HiOutlineArrowsPointingOut /> Fullscreen
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── View / Floor Buttons ─── */}
      <div className="pv-views">
        {!isFloorPlan ? (
          <>
            {(["isometric", "top", "front", "side"] as ViewType[]).map((v) => (
              <button
                key={v}
                className={`pv-btn ${view === v ? "pv-btn-active" : ""}`}
                onClick={() => setView(v)}
              >
                {v === "isometric" && (
                  <>
                    <HiOutlineCube />{" "}
                  </>
                )}
                {v === "top" && (
                  <>
                    <HiOutlineArrowDown />{" "}
                  </>
                )}
                {v === "front" && (
                  <>
                    <HiOutlineEye />{" "}
                  </>
                )}
                {v === "side" && (
                  <>
                    <HiOutlineArrowsRightLeft />{" "}
                  </>
                )}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
            <span className="pv-views-divider" />
            {Array.from({ length: config.totalFloors }, (_, i) => i + 1).map(
              (f) => (
                <button
                  key={`floor-btn-${f}`}
                  className={`pv-btn pv-btn-floor ${highlightFloor === f ? "pv-btn-highlight" : ""}`}
                  onClick={() => handleClickFloor(f)}
                  onMouseEnter={() => setHighlightFloor(f)}
                  onMouseLeave={() => setHighlightFloor(null)}
                >
                  F{f}
                </button>
              ),
            )}
          </>
        ) : (
          <>
            <button
              className="pv-btn pv-btn-active"
              onClick={handleBackToBuilding}
            >
              <HiOutlineBuildingOffice2 /> Building View
            </button>
            <span className="pv-views-divider" />
            {Array.from({ length: config.totalFloors }, (_, i) => i + 1).map(
              (f) => (
                <button
                  key={`floor-btn-${f}`}
                  className={`pv-btn ${activeFloor === f ? "pv-btn-active" : ""}`}
                  onClick={() => {
                    setActiveFloor(f);
                    setSelectedFlat(null);
                  }}
                >
                  F{f}
                </button>
              ),
            )}
          </>
        )}
      </div>

      {/* ─── Canvas ─── */}
      <div className="pv-canvas-wrapper">
        <Canvas
          camera={{ fov: 50, near: 0.1, far: 500 }}
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.4,
          }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
          style={{
            background: isFloorPlan
              ? "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)"
              : "#dbeafe",
          }}
          onPointerMissed={() => setSelectedFlat(null)}
        >
          <SceneSetup isFloorPlan={isFloorPlan} />
          <ResizeHandler isExpanded={isExpanded} />
          {isFloorPlan ? (
            <FloorPlanScene
              config={config}
              floorNum={activeFloor!}
              selectedFlat={selectedFlat}
              onSelectFlat={handleSelectFlat}
            />
          ) : (
            <BuildingScene
              config={config}
              selectedFlat={selectedFlat}
              onSelectFlat={handleSelectFlat}
              view={view}
              highlightFloor={highlightFloor}
              onClickFloor={handleClickFloor}
            />
          )}
        </Canvas>

        {/* Legend */}
        <div className="pv-legend">
          {isFloorPlan ? (
            <>
              <div className="pv-legend-title">Rooms</div>
              <div className="pv-legend-item">
                <span
                  className="pv-legend-dot"
                  style={{ background: "#e8f5e9" }}
                />{" "}
                Hall
              </div>
              <div className="pv-legend-item">
                <span
                  className="pv-legend-dot"
                  style={{ background: "#fff3e0" }}
                />{" "}
                Kitchen
              </div>
              <div className="pv-legend-item">
                <span
                  className="pv-legend-dot"
                  style={{ background: "#e3f2fd" }}
                />{" "}
                Bedroom
              </div>
              <div className="pv-legend-item">
                <span
                  className="pv-legend-dot"
                  style={{ background: "#e0f7fa" }}
                />{" "}
                Bathroom
              </div>
              <div className="pv-legend-item">
                <span
                  className="pv-legend-dot"
                  style={{ background: "#f1f8e9" }}
                />{" "}
                Balcony
              </div>
            </>
          ) : (
            <>
              <div className="pv-legend-item">
                <span
                  className="pv-legend-dot"
                  style={{ background: "#e6a817" }}
                />{" "}
                Owner ({ownerCount})
              </div>
              <div className="pv-legend-item">
                <span
                  className="pv-legend-dot"
                  style={{ background: "#7ca6d8", border: "1px solid #5a8ab5" }}
                />{" "}
                Builder ({builderCount})
              </div>
              <div className="pv-legend-item">
                <span
                  className="pv-legend-dot"
                  style={{ background: "#3b82f6" }}
                />{" "}
                Selected
              </div>
            </>
          )}
        </div>

        {/* Stats bar */}
        {!isFloorPlan && (
          <div className="pv-stats">
            <div className="pv-stat">
              <span className="pv-stat-value">{config.totalFloors}</span>
              <span className="pv-stat-label">Floors</span>
            </div>
            <div className="pv-stat">
              <span className="pv-stat-value">
                {config.typicalLayout.length}
              </span>
              <span className="pv-stat-label">Flats / Floor</span>
            </div>
            <div className="pv-stat">
              <span className="pv-stat-value">{totalFlats}</span>
              <span className="pv-stat-label">Total</span>
            </div>
            <div className="pv-stat">
              <span className="pv-stat-value">{ownerCount}</span>
              <span className="pv-stat-label">Owners</span>
            </div>
          </div>
        )}

        {/* Hint */}
        <div className="pv-hint">
          {isFloorPlan
            ? "🖱️ Click a flat boundary for details • Drag to pan • Scroll to zoom"
            : '🖱️ Click a flat or "Floor N →" for floor plan • Drag to rotate • Scroll to zoom'}
        </div>

        {/* Flat detail overlay */}
        {selectedFlat && (
          <FlatDetailOverlay
            flat={selectedFlat}
            onClose={() => setSelectedFlat(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ParametricViewer;
