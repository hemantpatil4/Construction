// ─── Parametric Building Viewer Types ───

export interface Room {
  name: string; // "Hall", "Kitchen", "Bedroom 1", "Bedroom 2", "Bath 1", "Bath 2", "Balcony", "Passage"
  position: [number, number]; // [x, z] local offset within the flat
  size: [number, number]; // [width, depth] in feet
  color?: string; // optional override color
}

export interface LayoutUnit {
  unitSuffix: string;
  position: [number, number]; // [x, z] offset in layout units
  size: [number, number]; // [width, depth] in layout units
  rooms: Room[]; // internal room layout for floor-plan view
}

export interface FlatInfo {
  flatNo: string;
  type: string;
  carpet: number;
  buArea: number;
  status: "OWNER" | "BUILDER" | string;
}

export interface CommonArea {
  name: string; // "Staircase 1", "Lift 1", "Lift 2", "Lobby", "Staircase 2"
  position: [number, number];
  size: [number, number];
  color?: string; // optional fill color for floor plan view
}

export interface AreaRect {
  position: [number, number];
  size: [number, number];
}

export interface BuildingConfig {
  buildingName: string;
  floorHeight: number;
  totalFloors: number;
  typicalLayout: LayoutUnit[];
  commonAreas?: CommonArea[];
  passage?: AreaRect; // covered corridor connecting common areas to Flat 03
  void?: AreaRect; // open-air void from ground to sky (no slab, no roof)
  flatData: FlatInfo[];
}
