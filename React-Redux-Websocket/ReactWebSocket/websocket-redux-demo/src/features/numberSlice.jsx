import { createSlice } from "@reduxjs/toolkit";

const numberSlice = createSlice({
  name: "number",
  initialState: {
    numbers: [],
  },
  reducers: {
    addNumber: (state, action) => {
      state.numbers.push(action.payload);
      if (state.numbers.length > 10) state.numbers.shift();
    },
  },
});

const userSlice = createSlice({
  name: "userData",
  initialState: {
    userData: [],
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
  },
});
export const { addNumber } = numberSlice.actions;
export const { setUserData } = userSlice.actions;
export default numberSlice.reducer;
export const userDataReducer = userSlice.reducer;
