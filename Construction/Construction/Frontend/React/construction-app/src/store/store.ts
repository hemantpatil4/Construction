import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import themeReducer from "./slices/themeSlice";
import buildingReducer from "./slices/buildingSlice";
import flatReducer from "./slices/flatSlice";
import usersReducer from "./slices/usersSlice";
import appSettingsReducer from "./slices/appSettingsSlice";
import galleryReducer from "./slices/gallerySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    buildings: buildingReducer,
    flats: flatReducer,
    users: usersReducer,
    appSettings: appSettingsReducer,
    gallery: galleryReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
