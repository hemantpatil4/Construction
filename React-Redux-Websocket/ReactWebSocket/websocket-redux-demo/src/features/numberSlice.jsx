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

export const { addNumber } = numberSlice.actions;
export default numberSlice.reducer;
