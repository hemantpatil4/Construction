import { createSlice } from "@reduxjs/toolkit";
import type { ThemeState, ThemeMode } from "../../types/theme.types";

const storedTheme = localStorage.getItem("theme") as ThemeMode | null;

const initialState: ThemeState = {
  mode: storedTheme || "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("theme", state.mode);
      document.documentElement.setAttribute("data-theme", state.mode);
    },
    setTheme(state, action) {
      state.mode = action.payload;
      localStorage.setItem("theme", state.mode);
      document.documentElement.setAttribute("data-theme", state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
