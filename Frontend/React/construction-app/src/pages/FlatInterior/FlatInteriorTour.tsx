import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import "./FlatInteriorTour.css";

/*
 ╔═══════════════════════════════════════════════════════════════╗
 ║  FLAT 103 — Premium 2BHK Interior Walkthrough                ║
 ║                                                               ║
 ║  Blueprint (from image, top = North):                         ║
 ║                                                               ║
 ║  ┌─────────────────┬──────────┐                               ║
 ║  │  LIVING 12×11   │ BALCONY  │   ← North                    ║
 ║  │  (sofa, TV,     │  4'wide  │                               ║
 ║  │   dining)       │          │                               ║
 ║  ├────┬──door──────┤──────────┤                               ║
 ║  │BATH│            │ DR.BALC  │                               ║
 ║  │4×7 │  KITCHEN   │ 6'6×3'9  │                              ║
 ║  │    │  11×8'3"   ├──door────┤                               ║
 ║  ├────┤            │ BED RM   │                               ║
 ║  │TOIL│   passage  │10'6×10   │                               ║
 ║  │7'9 │            ├──────────┤                               ║
 ║  │ ×4'│            │ M.BED RM │                               ║
 ║  ├────┤            │10'6×10'3 │                               ║
 ║  │ELE │            │          │                               ║
 ║  │DUCT│            │          │                               ║
 ║  └────┴────────────┴──────────┘   ← South                    ║
 ║                                                               ║
 ║  Scale: 1 Three.js unit = 1 foot                              ║
 ║  Flat overall: ~24' wide (X) × ~36' tall (Z going south)     ║
 ╚═══════════════════════════════════════════════════════════════╝
*/

interface Props {
  onClose: () => void;
  flatNumber?: string;
}

interface RoomDef {
  name: string;
  emoji: string;
  cx: number;
  cz: number;
  w: number;
  d: number;
  desc: string;
}

// ── Accurate room centers & sizes from blueprint ──
// X grows right, Z grows south (down on plan)
// The flat spans X: 0→24, Z: 0→36
const ROOMS: RoomDef[] = [
  {
    name: "Living Room",
    emoji: "🛋️",
    cx: 6,
    cz: 5.5,
    w: 12,
    d: 11,
    desc: "12' × 11'",
  },
  { name: "Balcony", emoji: "🌿", cx: 16, cz: 3, w: 6, d: 4, desc: "4' wide" },
  { name: "Bath", emoji: "🚿", cx: 2, cz: 14.5, w: 4, d: 7, desc: "4' × 7'" },
  {
    name: "Kitchen",
    emoji: "🍳",
    cx: 9.5,
    cz: 15,
    w: 7,
    d: 8,
    desc: "11' × 8'3\"",
  },
  {
    name: "DR Balcony",
    emoji: "🌅",
    cx: 17,
    cz: 12.5,
    w: 6,
    d: 3.5,
    desc: "6'6\" × 3'9\"",
  },
  {
    name: "Bed Room",
    emoji: "🛏️",
    cx: 19,
    cz: 20,
    w: 10,
    d: 10,
    desc: "10'6\" × 10'",
  },
  {
    name: "Toilet",
    emoji: "🚽",
    cx: 2.5,
    cz: 23,
    w: 5,
    d: 4,
    desc: "7'9\" × 4'",
  },
  {
    name: "M. Bed Room",
    emoji: "👑",
    cx: 19,
    cz: 31,
    w: 10,
    d: 10,
    desc: "10'6\" × 10'3\"",
  },
];

const FlatInteriorTour: React.FC<Props> = ({ onClose, flatNumber = "103" }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animRef = useRef(0);
  const wallsRef = useRef<THREE.Mesh[]>([]);
  const keysRef = useRef({ w: false, a: false, s: false, d: false });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const velRef = useRef(new THREE.Vector3());
  const prevTRef = useRef(performance.now());
  const lockedRef = useRef(false);
  const topViewRef = useRef(false);
  const savedPos = useRef(new THREE.Vector3(6, 1.65, 5));
  const savedYaw = useRef(0);
  const savedPitch = useRef(0);

  const [isLocked, setIsLocked] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("Living Room");
  const [showMinimap, setShowMinimap] = useState(true);
  const [playerPos, setPlayerPos] = useState({ x: 6, z: 5 });
  const [isTopView, setIsTopView] = useState(false);

  const detectRoom = useCallback((x: number, z: number) => {
    for (const r of ROOMS) {
      if (
        x >= r.cx - r.w / 2 - 1 &&
        x <= r.cx + r.w / 2 + 1 &&
        z >= r.cz - r.d / 2 - 1 &&
        z <= r.cz + r.d / 2 + 1
      )
        return r.name;
    }
    return "Passage";
  }, []);

  const toggleTopView = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    if (!topViewRef.current) {
      savedPos.current.copy(cam.position);
      savedYaw.current = yawRef.current;
      savedPitch.current = pitchRef.current;
      cam.position.set(12, 50, 18);
      cam.rotation.set(-Math.PI / 2, 0, 0);
      topViewRef.current = true;
      setIsTopView(true);
      if (document.pointerLockElement) document.exitPointerLock();
    } else {
      cam.position.copy(savedPos.current);
      yawRef.current = savedYaw.current;
      pitchRef.current = savedPitch.current;
      cam.rotation.set(pitchRef.current, yawRef.current, 0, "YXZ");
      topViewRef.current = false;
      setIsTopView(false);
    }
  }, []);

  /* ─── Procedural textures ─── */
  const makeWoodFloor = useCallback(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    const g = c.getContext("2d")!;
    // Warm parquet base
    g.fillStyle = "#8B6914";
    g.fillRect(0, 0, 1024, 1024);
    // Plank pattern
    const plankH = 64;
    for (let row = 0; row < 1024 / plankH; row++) {
      const offset = (row % 2) * 128;
      for (let col = -1; col < 1024 / 256 + 1; col++) {
        const x = col * 256 + offset;
        const y = row * plankH;
        // Plank color variation
        const r = 130 + Math.random() * 30;
        const gr2 = 90 + Math.random() * 25;
        const b = 20 + Math.random() * 15;
        g.fillStyle = `rgb(${r},${gr2},${b})`;
        g.fillRect(x + 1, y + 1, 254, plankH - 2);
        // Wood grain
        g.strokeStyle = `rgba(60,30,0,${0.05 + Math.random() * 0.08})`;
        g.lineWidth = 0.5;
        for (let i = 0; i < 8; i++) {
          g.beginPath();
          g.moveTo(x + 2, y + Math.random() * plankH);
          g.lineTo(x + 252, y + Math.random() * plankH);
          g.stroke();
        }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    t.anisotropy = 8;
    return t;
  }, []);

  const makeTileFloor = useCallback(
    (baseR: number, baseG: number, baseB: number) => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const g = c.getContext("2d")!;
      const s = 64;
      g.fillStyle = "#999";
      g.fillRect(0, 0, 512, 512); // grout
      for (let y = 0; y < 512; y += s)
        for (let x = 0; x < 512; x += s) {
          const v = Math.random() * 12 - 6;
          g.fillStyle = `rgb(${baseR + v},${baseG + v},${baseB + v})`;
          g.fillRect(x + 1.5, y + 1.5, s - 3, s - 3);
          // Slight gloss highlight
          g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
          g.fillRect(x + 3, y + 3, s / 2, s / 3);
        }
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(4, 4);
      t.anisotropy = 8;
      return t;
    },
    [],
  );

  const makeWallTex = useCallback(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f2ece0";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8000; i++) {
      g.fillStyle = `rgba(${Math.random() > 0.5 ? 0 : 180},${Math.random() > 0.5 ? 0 : 160},${Math.random() > 0.5 ? 0 : 130},${Math.random() * 0.012})`;
      g.fillRect(
        Math.random() * 512,
        Math.random() * 512,
        1 + Math.random() * 2,
        1 + Math.random() * 2,
      );
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 1);
    return t;
  }, []);

  const makeCarpetTex = useCallback(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#b8845c";
    g.fillRect(0, 0, 512, 512);
    // Carpet weave pattern
    for (let y = 0; y < 512; y += 4)
      for (let x = 0; x < 512; x += 4) {
        const v = Math.random() * 30 - 15;
        g.fillStyle = `rgb(${184 + v},${132 + v},${92 + v})`;
        g.fillRect(x, y, 3, 3);
      }
    // Border pattern
    g.strokeStyle = "#8B4513";
    g.lineWidth = 12;
    g.strokeRect(20, 20, 472, 472);
    g.strokeStyle = "#D4A76A";
    g.lineWidth = 4;
    g.strokeRect(28, 28, 456, 456);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    return t;
  }, []);

  /* ════════════════════════════════════════════════════════
     MAIN SCENE BUILD
     ════════════════════════════════════════════════════════ */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const colliders: THREE.Mesh[] = [];
    wallsRef.current = colliders;

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.004);

    /* ── Camera ── */
    const cam = new THREE.PerspectiveCamera(
      72,
      mount.clientWidth / mount.clientHeight,
      0.1,
      300,
    );
    cam.position.set(6, 1.65, 5);
    cameraRef.current = cam;

    /* ── Renderer ── */
    const r = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.setSize(mount.clientWidth, mount.clientHeight);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.15;
    mount.appendChild(r.domElement);
    rendererRef.current = r;

    /* ── Lighting — realistic interior ── */
    const hemi = new THREE.HemisphereLight(0xfff5e6, 0x8899aa, 0.7);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff8e1, 1.8);
    sun.position.set(15, 40, -15);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 45;
    sun.shadow.camera.bottom = -5;
    sun.shadow.bias = -0.0002;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // Warm interior fill lights per room
    const ptl = (
      x: number,
      y: number,
      z: number,
      col: number,
      int: number,
      dist: number,
    ) => {
      const l = new THREE.PointLight(col, int, dist);
      l.position.set(x, y, z);
      l.castShadow = true;
      l.shadow.mapSize.set(512, 512);
      scene.add(l);
    };
    ptl(6, 7, 5, 0xfff0d0, 0.6, 18); // living
    ptl(9.5, 7, 15, 0xffffff, 0.5, 14); // kitchen
    ptl(19, 7, 20, 0xffeebb, 0.4, 14); // bed
    ptl(19, 7, 31, 0xffeebb, 0.4, 14); // m.bed
    ptl(2, 7, 14.5, 0xffffff, 0.4, 10); // bath
    ptl(2.5, 7, 23, 0xffffff, 0.4, 10); // toilet

    /* ── Textures ── */
    const woodFloorTex = makeWoodFloor();
    const kitchenTileTex = makeTileFloor(220, 215, 200);
    const bathTileTex = makeTileFloor(170, 200, 210);
    const wallTex = makeWallTex();
    const carpetTex = makeCarpetTex();

    /* ── Materials ── */
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.9,
      color: 0xf2ece0,
    });
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.95,
    });
    const woodFloorMat = new THREE.MeshStandardMaterial({
      map: woodFloorTex,
      roughness: 0.35,
      metalness: 0.02,
    });
    const kitFloorMat = new THREE.MeshStandardMaterial({
      map: kitchenTileTex,
      roughness: 0.45,
    });
    const bathFloorMat = new THREE.MeshStandardMaterial({
      map: bathTileTex,
      roughness: 0.5,
    });
    const balcFloorMat = new THREE.MeshStandardMaterial({
      color: 0x8faa8f,
      roughness: 0.7,
    });
    const passFloorMat = new THREE.MeshStandardMaterial({
      map: kitchenTileTex,
      roughness: 0.5,
      color: 0xe8e0d0,
    });
    // Furniture
    const sofaMat = new THREE.MeshPhysicalMaterial({
      color: 0x3c2f2f,
      roughness: 0.78,
      clearcoat: 0.08,
    });
    const cushMat = new THREE.MeshPhysicalMaterial({
      color: 0x5a3a28,
      roughness: 0.85,
    });
    const dkWood = new THREE.MeshStandardMaterial({
      color: 0x4a2c17,
      roughness: 0.45,
      metalness: 0.02,
    });
    const lgWood = new THREE.MeshStandardMaterial({
      color: 0x9e7c5c,
      roughness: 0.4,
    });
    const counterM = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.3,
      metalness: 0.15,
    });
    const ssMetal = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.15,
      metalness: 0.9,
    });
    const bedSheet = new THREE.MeshPhysicalMaterial({
      color: 0xf5f0e8,
      roughness: 0.85,
    });
    const pillowA = new THREE.MeshPhysicalMaterial({
      color: 0x5577aa,
      roughness: 0.9,
    });
    const pillowB = new THREE.MeshPhysicalMaterial({
      color: 0x9b3a5c,
      roughness: 0.9,
    });
    const fixWhite = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.25,
      metalness: 0.15,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      transparent: true,
      roughness: 0.02,
      ior: 1.52,
      thickness: 0.08,
    });
    const tvBlack = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.15,
    });
    const plantGrn = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.8,
    });
    const potBrown = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.6,
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.25,
      metalness: 0.85,
    });
    const carpetMat = new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.95,
    });

    /* ── Helper: wall (collision) ── */
    const W = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      mat?: THREE.Material,
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || wallMat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      colliders.push(m);
    };
    /* ── Helper: floor ── */
    const F = (
      cx: number,
      cz: number,
      w: number,
      d: number,
      mat: THREE.Material,
    ) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(cx, 0.005, cz);
      m.receiveShadow = true;
      scene.add(m);
    };
    /* ── Helper: box furniture (with collision) ── */
    const B = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      colliders.push(m);
    };
    /* ── Helper: decorative box (no collision) ── */
    const D = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    };
    /* ── Helper: room label ── */
    const L = (text: string, emoji: string, x: number, z: number) => {
      const cv = document.createElement("canvas");
      cv.width = 512;
      cv.height = 128;
      const g = cv.getContext("2d")!;
      g.clearRect(0, 0, 512, 128);
      g.fillStyle = "rgba(10,10,15,0.75)";
      g.beginPath();
      g.roundRect(8, 8, 496, 112, 16);
      g.fill();
      g.strokeStyle = "rgba(0,255,200,0.4)";
      g.lineWidth = 2;
      g.stroke();
      g.fillStyle = "#fff";
      g.font = "bold 38px system-ui,sans-serif";
      g.textAlign = "center";
      g.fillText(`${emoji} ${text}`, 256, 74);
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(cv),
          transparent: true,
          depthTest: false,
        }),
      );
      sp.scale.set(3.5, 0.9, 1);
      sp.position.set(x, 6, z);
      scene.add(sp);
    };

    const WH = 9.5; // wall height (realistic ~9.5 ft ceilings)
    const HH = WH / 2; // half height
    const T = 0.4; // wall thickness

    /* ═══════════════════════════════════════
       FLOORS
       ═══════════════════════════════════════ */
    F(6, 5.5, 12, 11, woodFloorMat); // Living
    F(16, 3, 6, 4, balcFloorMat); // Balcony
    F(2, 14.5, 4, 7, bathFloorMat); // Bath
    F(9.5, 15, 7, 8, kitFloorMat); // Kitchen
    F(17, 12.5, 6, 3.5, balcFloorMat); // DR Balcony
    F(19, 20, 10, 10, woodFloorMat); // Bed RM
    F(2.5, 23, 5, 4, bathFloorMat); // Toilet
    F(19, 31, 10, 10, woodFloorMat); // M.Bed RM
    // Passage / corridor areas
    F(9, 20, 6, 6, passFloorMat); // central passage
    F(9, 27, 6, 8, passFloorMat); // lower passage
    F(6, 11.5, 4, 1.5, passFloorMat); // living-to-passage connector

    /* ═══════════════════════════════════════
       CEILING
       ═══════════════════════════════════════ */
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(30, 42), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(12, WH, 18);
    ceil.receiveShadow = true;
    scene.add(ceil);

    /* ═══════════════════════════════════════
       CARPET in Living Room
       ═══════════════════════════════════════ */
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(6, 0.02, 5);
    carpet.receiveShadow = true;
    scene.add(carpet);

    /* ═══════════════════════════════════════
       OUTER WALLS (perimeter of flat)
       Flat bounding box: X: -1 to 25, Z: -1 to 37
       ═══════════════════════════════════════ */
    W(12, HH, -0.5, 28, WH, T); // NORTH (top)
    W(12, HH, 36.5, 28, WH, T); // SOUTH (bottom)
    W(-0.5, HH, 18, T, WH, 38); // WEST (left)
    W(24.5, HH, 18, T, WH, 38); // EAST (right)

    /* ═══════════════════════════════════════
       INNER WALLS — with DOOR GAPS for walking
       Door gaps are 3 ft wide
       ═══════════════════════════════════════ */

    // ── Living Room south wall (Z=11) ──
    // Gap at X=5.5→8.5 (door from living to passage/kitchen)
    W(2.5, HH, 11, 5, WH, T); // left chunk  (X: 0→5)
    W(10.5, HH, 11, 4, WH, T); // right chunk (X: 8.5→12.5)

    // ── Living east wall (X=12, from Z=0 to Z=5) → partial, rest is open to balcony/passage
    W(12, HH, 2.5, T, WH, 5); // X=12, Z: 0→5

    // ── Balcony railing (low wall at Z=-0.5, north edge) ──
    W(16, 1.3, 1, 6, 2.6, 0.2, railMat); // balcony north railing
    W(19.5, 1.3, 3, 0.2, 2.6, 4, railMat); // balcony east railing

    // ── Bath walls ──
    W(4.2, HH, 14.5, T, WH, 7); // Bath east wall (X=4.2)
    // Bath-to-passage door gap at Z=12 → Z: 11→12 is open
    W(2, HH, 11, 4, WH, T); // overlaps with living south wall left chunk — skip, already placed
    // Bath south wall / divider to toilet area (Z=18)
    // Gap at X=1→3 for door
    W(4, HH, 18, 1.5, WH, T); // right of door

    // ── Kitchen area walls ──
    // Kitchen west wall (same as Bath east = X: 4.2... but kitchen starts at X=6)
    // Kitchen is open to passage on its west side mostly
    // Kitchen south wall (Z=19) with door gap to passage
    W(10, HH, 19, 5, WH, T); // partial south kitchen wall (X: 7.5→12.5)

    // ── DR Balcony railing ──
    W(17, 1.3, 10.5, 6, 2.6, 0.2, railMat); // DR balc south railing
    W(20.2, 1.3, 12.5, 0.2, 2.6, 4, railMat); // DR balc east side

    // ── Bed RM north wall (Z=15) with door gap ──
    // Gap at X=15→18
    W(21.5, HH, 15, 6, WH, T); // right of door (X: 18.5→24.5)

    // ── Bed RM / passage divider (X=14, Z: 15→25) ──
    W(14, HH, 17, T, WH, 4); // upper part  (Z: 15→19)
    W(14, HH, 23, T, WH, 4); // lower part  (Z: 21→25)
    // Gap at Z=19→21 for door

    // ── Bed RM / M.Bed divider (Z=26) with door gap ──
    // Gap at X=17→20
    W(15, HH, 26, 2, WH, T); // left of door
    W(22, HH, 26, 5, WH, T); // right of door

    // ── M.Bed RM left wall (X=14, Z: 26→36) ──
    W(14, HH, 31, T, WH, 10);

    // ── Toilet area ──
    // Toilet north wall (Z=21)
    W(2.5, HH, 21, 5, WH, T);
    // Toilet east wall (X=5.2) with gap for door
    W(5.2, HH, 23.5, T, WH, 3); // below door (Z: 22→25)
    // Toilet south wall (Z=25)
    W(2.5, HH, 25, 5, WH, T);

    // ── Passage left wall (west side of passage/corridor, X=6, Z: 18→26) ──
    // Door gaps already created by missing wall segments
    W(6, HH, 28, T, WH, 6); // X=6, Z: 25→31
    W(6, HH, 34, T, WH, 5); // X=6, Z: 31.5→36.5

    /* ═══════════════════════════════════════
       ROOM LABELS
       ═══════════════════════════════════════ */
    for (const rm of ROOMS) L(rm.name, rm.emoji, rm.cx, rm.cz);

    /* ═══════════════════════════════════════
       FURNITURE — LIVING ROOM
       ═══════════════════════════════════════ */
    // 3-seater sofa (against north wall)
    B(6, 0.22, 1.2, 6, 0.4, 1.8, sofaMat); // seat
    B(6, 0.52, 1.2, 6, 0.2, 1.6, cushMat); // cushions
    B(6, 0.65, 0.35, 6, 0.65, 0.35, sofaMat); // backrest
    D(3.2, 0.45, 1.2, 0.35, 0.55, 1.8, sofaMat); // armrest L
    D(8.8, 0.45, 1.2, 0.35, 0.55, 1.8, sofaMat); // armrest R
    // Sofa legs
    for (const [lx, lz] of [
      [3.5, 0.4],
      [8.5, 0.4],
      [3.5, 2],
      [8.5, 2],
    ]) {
      D(lx, 0.05, lz, 0.08, 0.1, 0.08, ssMetal);
    }

    // Coffee table (glass + wood)
    B(6, 0.22, 3.8, 3, 0.08, 1.4, dkWood); // shelf
    B(6, 0.48, 3.8, 3.2, 0.04, 1.5, glassMat); // glass top
    for (const [lx, lz] of [
      [4.6, 3.2],
      [7.4, 3.2],
      [4.6, 4.4],
      [7.4, 4.4],
    ]) {
      D(lx, 0.12, lz, 0.06, 0.24, 0.06, ssMetal);
    }

    // TV unit + TV (south living wall)
    B(6, 0.35, 9.8, 5, 0.7, 0.9, lgWood); // TV console
    B(6, 1.6, 10.2, 4.5, 2.5, 0.08, tvBlack); // TV
    // TV screen
    const tvCv = document.createElement("canvas");
    tvCv.width = 1024;
    tvCv.height = 512;
    const tvCtx = tvCv.getContext("2d")!;
    const tvGr = tvCtx.createLinearGradient(0, 0, 1024, 512);
    tvGr.addColorStop(0, "#0a1628");
    tvGr.addColorStop(0.5, "#1a3040");
    tvGr.addColorStop(1, "#0d2035");
    tvCtx.fillStyle = tvGr;
    tvCtx.fillRect(0, 0, 1024, 512);
    tvCtx.fillStyle = "rgba(0,220,180,0.08)";
    tvCtx.beginPath();
    tvCtx.arc(400, 260, 140, 0, Math.PI * 2);
    tvCtx.fill();
    tvCtx.fillStyle = "rgba(60,120,200,0.06)";
    tvCtx.beginPath();
    tvCtx.arc(700, 200, 180, 0, Math.PI * 2);
    tvCtx.fill();
    D(
      6,
      1.6,
      10.15,
      4.3,
      2.3,
      0.01,
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tvCv) }),
    );

    // Armchairs
    B(2.5, 0.22, 5, 2, 0.4, 2, sofaMat);
    B(2.5, 0.55, 4.1, 2, 0.5, 0.35, sofaMat); // back
    B(9.5, 0.22, 5, 2, 0.4, 2, sofaMat);
    B(9.5, 0.55, 4.1, 2, 0.5, 0.35, sofaMat);

    // Dining table + 4 chairs (lower living area near passage)
    B(6, 0.72, 8, 3, 0.06, 2, lgWood); // table top
    for (const [lx, lz] of [
      [4.7, 7.2],
      [7.3, 7.2],
      [4.7, 8.8],
      [7.3, 8.8],
    ]) {
      D(lx, 0.36, lz, 0.06, 0.72, 0.06, dkWood); // legs
    }
    for (const [cx, cz] of [
      [5.2, 7],
      [6.8, 7],
      [5.2, 9],
      [6.8, 9],
    ]) {
      B(cx, 0.22, cz, 0.8, 0.44, 0.8, dkWood); // chairs
      D(cx, 0.55, cz - 0.35, 0.75, 0.45, 0.06, dkWood); // chair back
    }

    /* ═══════════════════════════════════════
       FURNITURE — KITCHEN
       ═══════════════════════════════════════ */
    // L-shaped counter (north + east sides)
    B(8.5, 0.45, 11.8, 5, 0.9, 1, counterM); // north counter
    B(12.2, 0.45, 14.5, 1, 0.9, 4.5, counterM); // east counter
    // Counter top (marble-ish)
    D(
      8.5,
      0.92,
      11.8,
      5.2,
      0.04,
      1.1,
      new THREE.MeshStandardMaterial({
        color: 0xe8e4dc,
        roughness: 0.15,
        metalness: 0.05,
      }),
    );
    D(
      12.2,
      0.92,
      14.5,
      1.1,
      0.04,
      4.7,
      new THREE.MeshStandardMaterial({
        color: 0xe8e4dc,
        roughness: 0.15,
        metalness: 0.05,
      }),
    );
    // Stove
    D(
      9.5,
      0.96,
      11.8,
      1.5,
      0.05,
      0.8,
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.2,
        metalness: 0.7,
      }),
    );
    // Burner rings
    for (const [bx, bz] of [
      [9.2, 11.6],
      [9.8, 11.6],
      [9.2, 12.1],
      [9.8, 12.1],
    ]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.015, 8, 24),
        ssMetal,
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(bx, 1.0, bz);
      scene.add(ring);
    }
    // Sink
    D(11, 0.85, 11.8, 1.2, 0.15, 0.7, ssMetal);
    // Fridge
    B(
      7,
      1.0,
      18,
      1.3,
      2.0,
      1,
      new THREE.MeshStandardMaterial({
        color: 0xd8d8d8,
        roughness: 0.15,
        metalness: 0.5,
      }),
    );
    D(
      7,
      1.0,
      17.48,
      1.25,
      1.0,
      0.02,
      new THREE.MeshStandardMaterial({
        color: 0xccc,
        roughness: 0.1,
        metalness: 0.6,
      }),
    ); // fridge door line

    /* ═══════════════════════════════════════
       FURNITURE — BED ROOM
       ═══════════════════════════════════════ */
    B(19, 0.2, 21, 6, 0.35, 6.5, dkWood); // frame
    D(19, 0.42, 21, 5.5, 0.2, 6, bedSheet); // mattress
    // Pillows
    D(17.5, 0.62, 23.5, 1.4, 0.25, 0.9, pillowA);
    D(20.5, 0.62, 23.5, 1.4, 0.25, 0.9, pillowA);
    // Blanket fold
    D(
      19,
      0.55,
      19.5,
      5,
      0.08,
      1.5,
      new THREE.MeshPhysicalMaterial({ color: 0x8899aa, roughness: 0.9 }),
    );
    // Nightstand
    B(22.5, 0.35, 23.5, 1, 0.7, 0.8, dkWood);
    // Wardrobe
    B(15, 1.4, 20, 1.2, 2.8, 4, dkWood);
    D(
      15.62,
      1.4,
      20,
      0.02,
      2.7,
      3.8,
      new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.4 }),
    ); // door line

    /* ═══════════════════════════════════════
       FURNITURE — MASTER BEDROOM
       ═══════════════════════════════════════ */
    B(19, 0.2, 32, 7, 0.35, 7, dkWood); // frame
    D(19, 0.42, 32, 6.5, 0.2, 6.5, bedSheet); // mattress
    // Pillows (burgundy)
    D(17, 0.62, 34.5, 1.4, 0.25, 0.9, pillowB);
    D(19, 0.62, 34.5, 1.4, 0.25, 0.9, pillowB);
    D(21, 0.62, 34.5, 1.4, 0.25, 0.9, pillowB);
    // Blanket
    D(
      19,
      0.55,
      30,
      6,
      0.08,
      1.5,
      new THREE.MeshPhysicalMaterial({ color: 0x7a4a5a, roughness: 0.9 }),
    );
    // Nightstands
    B(15, 0.35, 34.5, 1, 0.7, 0.8, dkWood);
    B(23, 0.35, 34.5, 1, 0.7, 0.8, dkWood);
    // Dressing table + mirror
    B(23, 0.65, 28, 1.8, 0.08, 0.8, lgWood); // table
    D(23, 1.5, 27.6, 1.5, 1.2, 0.04, glassMat); // mirror
    // Wardrobe
    B(15, 1.4, 31, 1.2, 2.8, 5, dkWood);

    /* ═══════════════════════════════════════
       FURNITURE — BATH
       ═══════════════════════════════════════ */
    B(2, 0.35, 16, 2.5, 0.7, 2.5, fixWhite); // shower tray
    D(2, 0.85, 12.5, 1.2, 0.15, 0.7, fixWhite); // basin
    D(2, 1.2, 12.5, 0.8, 0.6, 0.05, glassMat); // mirror

    /* ═══════════════════════════════════════
       FURNITURE — TOILET
       ═══════════════════════════════════════ */
    B(2.5, 0.35, 23, 0.8, 0.7, 1.2, fixWhite); // toilet
    D(4, 0.85, 22, 0.9, 0.15, 0.6, fixWhite); // basin

    /* ═══════════════════════════════════════
       BALCONY PLANTS
       ═══════════════════════════════════════ */
    const addPlant = (px: number, pz: number, scale = 1) => {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.28 * scale,
          0.22 * scale,
          0.45 * scale,
          12,
        ),
        potBrown,
      );
      pot.position.set(px, 0.22 * scale, pz);
      pot.castShadow = true;
      scene.add(pot);
      // Bush shape (multiple spheres for realism)
      for (let i = 0; i < 3; i++) {
        const s = (0.25 + Math.random() * 0.2) * scale;
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(s, 8, 8),
          plantGrn,
        );
        leaf.position.set(
          px + (Math.random() - 0.5) * 0.3,
          0.5 * scale + s + Math.random() * 0.15,
          pz + (Math.random() - 0.5) * 0.3,
        );
        leaf.castShadow = true;
        scene.add(leaf);
      }
    };
    addPlant(14.5, 1.5);
    addPlant(16, 1.5);
    addPlant(17.5, 1.5);
    addPlant(15.5, 11);
    addPlant(18, 11);

    /* ═══════════════════════════════════════
       HOTSPOT MARKERS
       ═══════════════════════════════════════ */
    const addHotspot = (x: number, y: number, z: number) => {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ffcc }),
      );
      core.position.set(x, y, z);
      scene.add(core);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.015, 16, 32),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.35,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, y, z);
      scene.add(ring);
    };
    addHotspot(6, 2.5, 1.2); // sofa
    addHotspot(6, 3, 10); // TV
    addHotspot(9.5, 2, 12); // kitchen counter
    addHotspot(19, 2, 21); // bed rm
    addHotspot(19, 2, 32); // m.bed rm

    /* ═══════════════════════════════════════
       ANIMATION LOOP
       ═══════════════════════════════════════ */
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - prevTRef.current) / 1000, 0.05);
      prevTRef.current = now;

      if (lockedRef.current && !topViewRef.current) {
        const v = velRef.current,
          k = keysRef.current,
          yw = yawRef.current;
        v.x -= v.x * 10 * dt;
        v.z -= v.z * 10 * dt;
        const spd = 25 * dt;
        if (k.w) {
          v.x -= Math.sin(yw) * spd;
          v.z -= Math.cos(yw) * spd;
        }
        if (k.s) {
          v.x += Math.sin(yw) * spd;
          v.z += Math.cos(yw) * spd;
        }
        if (k.a) {
          v.x -= Math.cos(yw) * spd;
          v.z += Math.sin(yw) * spd;
        }
        if (k.d) {
          v.x += Math.cos(yw) * spd;
          v.z -= Math.sin(yw) * spd;
        }

        const nx = cam.position.x + v.x * dt;
        const nz = cam.position.z + v.z * dt;
        const pb = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(nx, 1.0, nz),
          new THREE.Vector3(0.5, 1.4, 0.5),
        );
        let blocked = false;
        for (const o of colliders) {
          if (pb.intersectsBox(new THREE.Box3().setFromObject(o))) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          cam.position.x = nx;
          cam.position.z = nz;
        }
        cam.position.y = 1.65;

        setCurrentRoom(detectRoom(cam.position.x, cam.position.z));
        setPlayerPos({ x: cam.position.x, z: cam.position.z });
      }

      if (topViewRef.current) {
        const k = keysRef.current,
          ps = 18 * dt;
        if (k.w) cam.position.z -= ps;
        if (k.s) cam.position.z += ps;
        if (k.a) cam.position.x -= ps;
        if (k.d) cam.position.x += ps;
        cam.rotation.set(-Math.PI / 2, 0, 0);
      }

      r.render(scene, cam);
    };
    animate();

    /* ═══════════════════════════════════════
       EVENTS
       ═══════════════════════════════════════ */
    const onResize = () => {
      cam.aspect = mount.clientWidth / mount.clientHeight;
      cam.updateProjectionMatrix();
      r.setSize(mount.clientWidth, mount.clientHeight);
    };
    const onClick = () => {
      if (!topViewRef.current) mount.requestPointerLock();
    };
    const onLock = () => {
      const l = document.pointerLockElement === mount;
      lockedRef.current = l;
      setIsLocked(l);
    };
    const onMouse = (e: MouseEvent) => {
      if (document.pointerLockElement === mount && !topViewRef.current) {
        yawRef.current -= e.movementX * 0.002;
        pitchRef.current = Math.max(
          -1.4,
          Math.min(1.4, pitchRef.current - e.movementY * 0.002),
        );
        cam.rotation.set(pitchRef.current, yawRef.current, 0, "YXZ");
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (topViewRef.current)
        cam.position.y = Math.max(
          15,
          Math.min(90, cam.position.y + e.deltaY * 0.06),
        );
    };
    const onKD = (e: KeyboardEvent) => {
      if (e.code === "KeyW") keysRef.current.w = true;
      if (e.code === "KeyS") keysRef.current.s = true;
      if (e.code === "KeyA") keysRef.current.a = true;
      if (e.code === "KeyD") keysRef.current.d = true;
      if (e.code === "KeyM") setShowMinimap((p) => !p);
      if (e.code === "KeyT") toggleTopView();
    };
    const onKU = (e: KeyboardEvent) => {
      if (e.code === "KeyW") keysRef.current.w = false;
      if (e.code === "KeyS") keysRef.current.s = false;
      if (e.code === "KeyA") keysRef.current.a = false;
      if (e.code === "KeyD") keysRef.current.d = false;
    };

    window.addEventListener("resize", onResize);
    mount.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLock);
    document.addEventListener("mousemove", onMouse);
    mount.addEventListener("wheel", onWheel, { passive: true });
    document.addEventListener("keydown", onKD);
    document.addEventListener("keyup", onKU);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLock);
      document.removeEventListener("mousemove", onMouse);
      mount.removeEventListener("wheel", onWheel);
      document.removeEventListener("keydown", onKD);
      document.removeEventListener("keyup", onKU);
      if (document.pointerLockElement === mount) document.exitPointerLock();
      r.dispose();
      scene.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          const m = c.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      if (mount.contains(r.domElement)) mount.removeChild(r.domElement);
    };
  }, [
    makeWoodFloor,
    makeTileFloor,
    makeWallTex,
    makeCarpetTex,
    detectRoom,
    toggleTopView,
  ]);

  // ESC to exit (only when not pointer-locked)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !lockedRef.current) onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Teleport to room
  const goTo = useCallback((rm: RoomDef) => {
    const c = cameraRef.current;
    if (!c) return;
    if (topViewRef.current) {
      c.position.x = rm.cx;
      c.position.z = rm.cz;
    } else {
      c.position.set(rm.cx, 1.65, rm.cz);
      yawRef.current = 0;
      pitchRef.current = 0;
      c.rotation.set(0, 0, 0, "YXZ");
    }
  }, []);

  /* ── Minimap ── */
  const Minimap = () => {
    const S = 3.8,
      ox = 1,
      oz = 1.5;
    return (
      <svg
        width={100}
        height={150}
        viewBox="0 0 100 150"
        className="minimap-svg"
      >
        {ROOMS.map((rm, i) => (
          <g key={i}>
            <rect
              x={(rm.cx - rm.w / 2 + ox) * S}
              y={(rm.cz - rm.d / 2 + oz) * S}
              width={rm.w * S}
              height={rm.d * S}
              fill={
                currentRoom === rm.name
                  ? "rgba(0,255,200,0.25)"
                  : "rgba(255,255,255,0.06)"
              }
              stroke={
                currentRoom === rm.name ? "#00ffc8" : "rgba(255,255,255,0.15)"
              }
              strokeWidth={currentRoom === rm.name ? 1.5 : 0.7}
              rx={2}
            />
            <text
              x={(rm.cx + ox) * S}
              y={(rm.cz + oz) * S + 1}
              textAnchor="middle"
              fill={
                currentRoom === rm.name ? "#00ffc8" : "rgba(255,255,255,0.4)"
              }
              fontSize={5}
            >
              {rm.emoji}
            </text>
          </g>
        ))}
        <circle
          cx={(playerPos.x + ox) * S}
          cy={(playerPos.z + oz) * S}
          r={3}
          fill="#00ffc8"
          stroke="#fff"
          strokeWidth={1}
        >
          <animate
            attributeName="r"
            values="2;4;2"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    );
  };

  return (
    <div className="fit-container">
      <div ref={mountRef} className="fit-canvas" />

      {isLocked && !isTopView && <div className="fit-crosshair">+</div>}

      {/* Instructions */}
      {!isLocked && !isTopView && (
        <div className="fit-overlay">
          <div className="fit-card">
            <span className="fit-badge">FLAT {flatNumber}</span>
            <h2>🏠 Interior Walkthrough</h2>
            <p className="fit-sub">2BHK • Carpet 660 sq.ft • 1st Floor</p>
            <div className="fit-keys">
              <div className="fit-key-grid">
                <div className="fit-key-row">
                  <kbd>W</kbd>
                </div>
                <div className="fit-key-row">
                  <kbd>A</kbd>
                  <kbd>S</kbd>
                  <kbd>D</kbd>
                </div>
              </div>
              <span>Move</span>
            </div>
            <div className="fit-keys">
              <span className="fit-mouse">🖱️</span>
              <span>Look Around</span>
            </div>
            <button
              className="fit-enter"
              onClick={() => mountRef.current?.requestPointerLock()}
            >
              Click to Enter
            </button>
            <p className="fit-hint">
              ESC = release mouse • ESC again = exit tour • T = top view
            </p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="fit-top">
        <div className="fit-title">
          <h1>
            Flat {flatNumber}
            {isTopView ? " — Top View" : ""}
          </h1>
          <p>
            {isTopView
              ? "Bird's eye • Scroll zoom • WASD pan"
              : `${currentRoom}`}
          </p>
        </div>
        <div className="fit-top-r">
          <button className="fit-topview-btn" onClick={toggleTopView}>
            {isTopView ? "🎮 FPS" : "🗺️ Top View"}
          </button>
          <div className="fit-hints">
            <span>WASD</span>
            <span className="sep">•</span>
            <span>T = View</span>
            <span className="sep">•</span>
            <span>M = Map</span>
          </div>
          <button className="fit-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {/* Room indicator */}
      {isLocked && !isTopView && (
        <div className="fit-room-ind">
          <span className="fit-dot" />
          <span>
            {ROOMS.find((r) => r.name === currentRoom)?.emoji || "🚪"}
          </span>
          <span className="fit-room-name">{currentRoom}</span>
          <span className="fit-room-desc">
            {ROOMS.find((r) => r.name === currentRoom)?.desc || ""}
          </span>
        </div>
      )}

      {/* Minimap */}
      {showMinimap && !isTopView && (
        <div className="fit-minimap">
          <div className="fit-minimap-hdr">
            <span>FLOOR PLAN</span>
            <button onClick={() => setShowMinimap(false)}>✕</button>
          </div>
          <Minimap />
        </div>
      )}

      {/* Room nav */}
      <div className="fit-nav">
        {ROOMS.map((rm) => (
          <button
            key={rm.name}
            className={`fit-nav-btn ${currentRoom === rm.name ? "active" : ""}`}
            onClick={() => goTo(rm)}
            title={rm.desc}
          >
            <span>{rm.emoji}</span>
            <span className="fit-nav-name">{rm.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FlatInteriorTour;
