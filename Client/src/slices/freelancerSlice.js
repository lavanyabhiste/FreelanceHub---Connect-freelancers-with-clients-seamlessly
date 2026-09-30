import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { freelancerService } from '../services/freelancerService';

// ── Async Thunks ────────────────────────────────────────────────────────────
export const fetchFreelancerStats = createAsyncThunk(
  'freelancer/fetchStats',
  async (_, { rejectWithValue }) => {
    try { return await freelancerService.getStats(); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchMyApplications = createAsyncThunk(
  'freelancer/fetchApplications',
  async (params, { rejectWithValue }) => {
    try { return await freelancerService.getMyApplications(params); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchMyFreelancerProjects = createAsyncThunk(
  'freelancer/fetchMyProjects',
  async (params, { rejectWithValue }) => {
    try { return await freelancerService.getMyProjects(params); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const submitBid = createAsyncThunk(
  'freelancer/submitBid',
  async (data, { rejectWithValue }) => {
    try { return await freelancerService.submitBid(data); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const submitWork = createAsyncThunk(
  'freelancer/submitWork',
  async (data, { rejectWithValue }) => {
    try { return await freelancerService.submitWork(data); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const updateFreelancerProfile = createAsyncThunk(
  'freelancer/updateProfile',
  async (data, { rejectWithValue }) => {
    try { return await freelancerService.updateProfile(data); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

// ── Slice ───────────────────────────────────────────────────────────────────
const freelancerSlice = createSlice({
  name: 'freelancer',
  initialState: {
    stats: null,
    applications: [],
    myProjects: [],
    total: 0,
    totalPages: 1,
    currentPage: 1,
    loading: false,
    actionLoading: false,
    profileLoading: false,
    error: null,
  },
  reducers: {
    clearFreelancerError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null; };
    const setError = (state, action) => { state.loading = false; state.error = action.payload; };
    const setActionLoading = (state) => { state.actionLoading = true; state.error = null; };
    const clearActionLoading = (state) => { state.actionLoading = false; };

    builder
      // Stats
      .addCase(fetchFreelancerStats.pending, setLoading)
      .addCase(fetchFreelancerStats.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.stats = payload.stats;
      })
      .addCase(fetchFreelancerStats.rejected, setError)

      // Applications
      .addCase(fetchMyApplications.pending, setLoading)
      .addCase(fetchMyApplications.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.applications = payload.applications;
        state.total = payload.total;
        state.totalPages = payload.totalPages;
        state.currentPage = payload.currentPage;
      })
      .addCase(fetchMyApplications.rejected, setError)

      // My Projects
      .addCase(fetchMyFreelancerProjects.pending, setLoading)
      .addCase(fetchMyFreelancerProjects.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.myProjects = payload.projects;
        state.total = payload.total;
        state.totalPages = payload.totalPages;
        state.currentPage = payload.currentPage;
      })
      .addCase(fetchMyFreelancerProjects.rejected, setError)

      // Submit Bid
      .addCase(submitBid.pending, setActionLoading)
      .addCase(submitBid.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.applications.unshift(payload.application);
      })
      .addCase(submitBid.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Submit Work
      .addCase(submitWork.pending, setActionLoading)
      .addCase(submitWork.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        const idx = state.myProjects.findIndex((p) => p._id === payload.project._id);
        if (idx !== -1) state.myProjects[idx] = payload.project;
      })
      .addCase(submitWork.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update Profile
      .addCase(updateFreelancerProfile.pending, (state) => { state.profileLoading = true; state.error = null; })
      .addCase(updateFreelancerProfile.fulfilled, (state, { payload }) => {
        state.profileLoading = false;
      })
      .addCase(updateFreelancerProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFreelancerError } = freelancerSlice.actions;
export default freelancerSlice.reducer;
