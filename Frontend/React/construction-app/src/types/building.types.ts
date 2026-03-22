// ─── Building DTOs ───

export interface BuildingRead {
  id: number;
  name: string;
  address: string;
  city: string;
  totalFloors: number;
  totalFlats: number;
  baseAreaSqFt: number;
  buildingType: string;
  yearBuilt: number | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  showOnMap: boolean;
  createdAt: string;
  flatCount: number;
}

export interface BuildingDetail {
  id: number;
  name: string;
  address: string;
  city: string;
  totalFloors: number;
  totalFlats: number;
  baseAreaSqFt: number;
  buildingType: string;
  yearBuilt: number | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  showOnMap: boolean;
  createdAt: string;
  flats: FlatRead[];
}

export interface CreateBuilding {
  name: string;
  address: string;
  city: string;
  totalFloors: number;
  totalFlats: number;
  baseAreaSqFt: number;
  buildingType: string;
  yearBuilt?: number | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  showOnMap?: boolean;
}

export interface UpdateBuilding {
  name: string;
  address: string;
  city: string;
  totalFloors: number;
  totalFlats: number;
  baseAreaSqFt: number;
  buildingType: string;
  yearBuilt?: number | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  showOnMap?: boolean;
}

// ─── Flat DTOs ───

export interface FlatRead {
  id: number;
  flatNumber: string;
  floorNumber: number;
  areaInSqFt: number;
  price: number;
  isAvailable: boolean;
  buildingId: number;
  buildingName: string;
  createdAt: string;
}

export interface CreateFlat {
  flatNumber: string;
  floorNumber: number;
  areaInSqFt: number;
  price: number;
  isAvailable: boolean;
  buildingId: number;
}

export interface UpdateFlat {
  flatNumber: string;
  floorNumber: number;
  areaInSqFt: number;
  price: number;
  isAvailable: boolean;
  buildingId: number;
}

// ─── Redux State ───

export interface BuildingState {
  buildings: BuildingRead[];
  selectedBuilding: BuildingDetail | null;
  loading: boolean;
  error: string | null;
}

export interface FlatState {
  flats: FlatRead[];
  loading: boolean;
  error: string | null;
}
