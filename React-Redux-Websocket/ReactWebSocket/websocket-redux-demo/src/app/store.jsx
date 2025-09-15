import { configureStore } from "@reduxjs/toolkit";

import flatsReducer from "../features/flatsSlice";
import buildingsReducer from "../features/buildingsSlice";

export const store = configureStore({
  reducer: {
    flats: flatsReducer,
    buildings: buildingsReducer,
  },
});
