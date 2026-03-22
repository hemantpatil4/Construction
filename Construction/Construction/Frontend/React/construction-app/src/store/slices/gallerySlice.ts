import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type {
  GalleryState,
  GallerySectionRead,
  GallerySectionDetail,
  CreateGallerySection,
  UpdateGallerySection,
  GalleryPhotoRead,
  CreateGalleryPhoto,
  UpdateGalleryPhoto,
} from "../../types/gallery.types";
import * as galleryService from "../../services/gallery.service";

const initialState: GalleryState = {
  sections: [],
  photos: [],
  selectedSection: null,
  loading: false,
  error: null,
};

// ═══════════════════════════════════════════════════════════
//  SECTION THUNKS
// ═══════════════════════════════════════════════════════════

export const fetchSections = createAsyncThunk<
  GallerySectionRead[],
  boolean | undefined,
  { rejectValue: string }
>(
  "gallery/fetchSections",
  async (includeInactive = false, { rejectWithValue }) => {
    try {
      return await galleryService.getSections(includeInactive);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch sections",
      );
    }
  },
);

export const fetchSectionById = createAsyncThunk<
  GallerySectionDetail,
  number,
  { rejectValue: string }
>("gallery/fetchSectionById", async (id, { rejectWithValue }) => {
  try {
    return await galleryService.getSectionById(id);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch section",
    );
  }
});

export const createSection = createAsyncThunk<
  GallerySectionRead,
  CreateGallerySection,
  { rejectValue: string }
>("gallery/createSection", async (data, { rejectWithValue }) => {
  try {
    return await galleryService.createSection(data);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to create section",
    );
  }
});

export const updateSection = createAsyncThunk<
  GallerySectionRead,
  { id: number; data: UpdateGallerySection },
  { rejectValue: string }
>("gallery/updateSection", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await galleryService.updateSection(id, data);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to update section",
    );
  }
});

export const deleteSection = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("gallery/deleteSection", async (id, { rejectWithValue }) => {
  try {
    await galleryService.deleteSection(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to delete section",
    );
  }
});

// ═══════════════════════════════════════════════════════════
//  PHOTO THUNKS
// ═══════════════════════════════════════════════════════════

export const fetchAllPhotos = createAsyncThunk<
  GalleryPhotoRead[],
  boolean | undefined,
  { rejectValue: string }
>(
  "gallery/fetchAllPhotos",
  async (includeInactive = false, { rejectWithValue }) => {
    try {
      return await galleryService.getAllPhotos(includeInactive);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch photos",
      );
    }
  },
);

export const fetchGeneralPhotos = createAsyncThunk<
  GalleryPhotoRead[],
  void,
  { rejectValue: string }
>("gallery/fetchGeneralPhotos", async (_, { rejectWithValue }) => {
  try {
    return await galleryService.getGeneralPhotos();
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch general photos",
    );
  }
});

export const fetchPhotosByBuilding = createAsyncThunk<
  GalleryPhotoRead[],
  number,
  { rejectValue: string }
>("gallery/fetchPhotosByBuilding", async (buildingId, { rejectWithValue }) => {
  try {
    return await galleryService.getPhotosByBuilding(buildingId);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch building photos",
    );
  }
});

export const createPhoto = createAsyncThunk<
  GalleryPhotoRead,
  CreateGalleryPhoto,
  { rejectValue: string }
>("gallery/createPhoto", async (data, { rejectWithValue }) => {
  try {
    return await galleryService.createPhoto(data);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to create photo",
    );
  }
});

export const updatePhoto = createAsyncThunk<
  GalleryPhotoRead,
  { id: number; data: UpdateGalleryPhoto },
  { rejectValue: string }
>("gallery/updatePhoto", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await galleryService.updatePhoto(id, data);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to update photo",
    );
  }
});

export const deletePhoto = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("gallery/deletePhoto", async (id, { rejectWithValue }) => {
  try {
    await galleryService.deletePhoto(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to delete photo",
    );
  }
});

// ═══════════════════════════════════════════════════════════
//  SLICE
// ═══════════════════════════════════════════════════════════

const gallerySlice = createSlice({
  name: "gallery",
  initialState,
  reducers: {
    clearGalleryError: (state) => {
      state.error = null;
    },
    clearSelectedSection: (state) => {
      state.selectedSection = null;
    },
  },
  extraReducers: (builder) => {
    // ─── Sections ───
    builder
      .addCase(fetchSections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSections.fulfilled, (state, action) => {
        state.loading = false;
        state.sections = action.payload;
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      })
      .addCase(fetchSectionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSection = action.payload;
      })
      .addCase(fetchSectionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      })
      .addCase(createSection.fulfilled, (state, action) => {
        state.sections.push(action.payload);
      })
      .addCase(updateSection.fulfilled, (state, action) => {
        const idx = state.sections.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.sections[idx] = action.payload;
      })
      .addCase(deleteSection.fulfilled, (state, action) => {
        state.sections = state.sections.filter((s) => s.id !== action.payload);
      });

    // ─── Photos ───
    builder
      .addCase(fetchAllPhotos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = action.payload;
      })
      .addCase(fetchAllPhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      })
      .addCase(fetchGeneralPhotos.fulfilled, (state, action) => {
        state.photos = action.payload;
      })
      .addCase(fetchPhotosByBuilding.fulfilled, (state, action) => {
        state.photos = action.payload;
      })
      .addCase(createPhoto.fulfilled, (state, action) => {
        state.photos.push(action.payload);
      })
      .addCase(updatePhoto.fulfilled, (state, action) => {
        const idx = state.photos.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.photos[idx] = action.payload;
      })
      .addCase(deletePhoto.fulfilled, (state, action) => {
        state.photos = state.photos.filter((p) => p.id !== action.payload);
      });
  },
});

export const { clearGalleryError, clearSelectedSection } = gallerySlice.actions;
export default gallerySlice.reducer;
