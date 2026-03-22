import axios from "axios";
import type {
  GallerySectionRead,
  GallerySectionDetail,
  CreateGallerySection,
  UpdateGallerySection,
  GalleryPhotoRead,
  CreateGalleryPhoto,
  UpdateGalleryPhoto,
} from "../types/gallery.types";

const API_BASE = "/api/Gallery";

// ═══════════════════════════════════════════════════════════
//  SECTIONS
// ═══════════════════════════════════════════════════════════

export const getSections = async (
  includeInactive = false,
): Promise<GallerySectionRead[]> => {
  const res = await axios.get(`${API_BASE}/sections`, {
    params: { includeInactive },
  });
  return res.data;
};

export const getSectionById = async (
  id: number,
): Promise<GallerySectionDetail> => {
  const res = await axios.get(`${API_BASE}/sections/${id}`);
  return res.data;
};

export const createSection = async (
  data: CreateGallerySection,
): Promise<GallerySectionRead> => {
  const token = localStorage.getItem("token");
  const res = await axios.post(`${API_BASE}/sections`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateSection = async (
  id: number,
  data: UpdateGallerySection,
): Promise<GallerySectionRead> => {
  const token = localStorage.getItem("token");
  const res = await axios.put(`${API_BASE}/sections/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteSection = async (id: number): Promise<void> => {
  const token = localStorage.getItem("token");
  await axios.delete(`${API_BASE}/sections/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ═══════════════════════════════════════════════════════════
//  PHOTOS
// ═══════════════════════════════════════════════════════════

export const getAllPhotos = async (
  includeInactive = false,
): Promise<GalleryPhotoRead[]> => {
  const res = await axios.get(`${API_BASE}/photos`, {
    params: { includeInactive },
  });
  return res.data;
};

export const getGeneralPhotos = async (): Promise<GalleryPhotoRead[]> => {
  const res = await axios.get(`${API_BASE}/photos/general`);
  return res.data;
};

export const getPhotosBySection = async (
  sectionId: number,
): Promise<GalleryPhotoRead[]> => {
  const res = await axios.get(`${API_BASE}/photos/section/${sectionId}`);
  return res.data;
};

export const getPhotosByBuilding = async (
  buildingId: number,
): Promise<GalleryPhotoRead[]> => {
  const res = await axios.get(`${API_BASE}/photos/building/${buildingId}`);
  return res.data;
};

export const getPhotoById = async (id: number): Promise<GalleryPhotoRead> => {
  const res = await axios.get(`${API_BASE}/photos/${id}`);
  return res.data;
};

export const createPhoto = async (
  data: CreateGalleryPhoto,
): Promise<GalleryPhotoRead> => {
  const token = localStorage.getItem("token");
  const res = await axios.post(`${API_BASE}/photos`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updatePhoto = async (
  id: number,
  data: UpdateGalleryPhoto,
): Promise<GalleryPhotoRead> => {
  const token = localStorage.getItem("token");
  const res = await axios.put(`${API_BASE}/photos/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deletePhoto = async (id: number): Promise<void> => {
  const token = localStorage.getItem("token");
  await axios.delete(`${API_BASE}/photos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
