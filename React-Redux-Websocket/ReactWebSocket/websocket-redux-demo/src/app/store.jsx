import { configureStore } from "@reduxjs/toolkit";
import numberReducer from "../features/numberSlice";

export const store = configureStore({
  reducer: {
    number: numberReducer,
  },
});
