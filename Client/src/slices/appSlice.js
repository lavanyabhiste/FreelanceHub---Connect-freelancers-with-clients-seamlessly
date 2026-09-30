import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { healthService } from '../services/api';

export const fetchServerHealth = createAsyncThunk(
  'app/fetchServerHealth',
  async (_, { rejectWithValue }) => {
    try {
      const data = await healthService.checkHealth();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  appName: 'FreelanceHub',
  tagline: 'Connect Freelancers with Clients Seamlessly',
  healthData: null,
  healthLoading: false,
  healthError: null,
  activeRole: 'guest', // 'client' | 'freelancer' | 'admin' | 'guest'
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setActiveRole: (state, action) => {
      state.activeRole = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServerHealth.pending, (state) => {
        state.healthLoading = true;
        state.healthError = null;
      })
      .addCase(fetchServerHealth.fulfilled, (state, action) => {
        state.healthLoading = false;
        state.healthData = action.payload;
      })
      .addCase(fetchServerHealth.rejected, (state, action) => {
        state.healthLoading = false;
        state.healthError = action.payload || 'Unable to connect to backend';
      });
  },
});

export const { setActiveRole } = appSlice.actions;
export default appSlice.reducer;
