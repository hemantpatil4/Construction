// ─── Gallery Section ───

export interface GallerySectionRead {
  id: number;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  photoCount: number;
}

export interface GallerySectionDetail {
  id: number;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  photos: GalleryPhotoRead[];
}

export interface CreateGallerySection {
  name: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateGallerySection {
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

// ─── Gallery Photo ───

export interface GalleryPhotoRead {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  sectionId: number;
  sectionName: string;
  buildingId: number | null;
  buildingName: string | null;
}

export interface CreateGalleryPhoto {
  title: string;
  description?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  sectionId: number;
  buildingId?: number | null;
}

export interface UpdateGalleryPhoto {
  title: string;
  description?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  sectionId: number;
  buildingId?: number | null;
}

// ─── Redux State ───

export interface GalleryState {
  sections: GallerySectionRead[];
  photos: GalleryPhotoRead[];
  selectedSection: GallerySectionDetail | null;
  loading: boolean;
  error: string | null;
}
