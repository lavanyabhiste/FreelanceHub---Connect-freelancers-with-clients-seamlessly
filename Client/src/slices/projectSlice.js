import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectService } from '../services/projectService';

// ── Async Thunks ────────────────────────────────────────────────────────────
export const fetchMyProjects = createAsyncThunk(
  'projects/fetchMyProjects',
  async (params, { rejectWithValue }) => {
    try { return await projectService.getMyProjects(params); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchAllProjects = createAsyncThunk(
  'projects/fetchAll',
  async (params, { rejectWithValue }) => {
    try { return await projectService.getAllProjects(params); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchById',
  async (id, { rejectWithValue }) => {
    try { return await projectService.getProjectById(id); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (data, { rejectWithValue }) => {
    try { return await projectService.createProject(data); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, data }, { rejectWithValue }) => {
    try { return await projectService.updateProject(id, data); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id, { rejectWithValue }) => {
    try { await projectService.deleteProject(id); return id; }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchProjectApplications = createAsyncThunk(
  'projects/fetchApplications',
  async (projectId, { rejectWithValue }) => {
    try { return await projectService.getProjectApplications(projectId); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const updateApplicationStatus = createAsyncThunk(
  'projects/updateAppStatus',
  async ({ projectId, appId, status }, { rejectWithValue }) => {
    try { return await projectService.updateApplicationStatus(projectId, appId, status); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const markProjectCompleted = createAsyncThunk(
  'projects/complete',
  async (id, { rejectWithValue }) => {
    try { return await projectService.markCompleted(id); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const requestRevision = createAsyncThunk(
  'projects/revision',
  async ({ id, note }, { rejectWithValue }) => {
    try { return await projectService.requestRevision(id, note); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchClientStats = createAsyncThunk(
  'projects/clientStats',
  async (_, { rejectWithValue }) => {
    try { return await projectService.getClientStats(); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

// ── Slice ───────────────────────────────────────────────────────────────────
const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    applications: [],
    stats: null,
    total: 0,
    totalPages: 1,
    currentPage: 1,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearProjectError: (state) => { state.error = null; },
    clearCurrentProject: (state) => { state.currentProject = null; state.applications = []; },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null; };
    const setError = (state, action) => { state.loading = false; state.error = action.payload; };
    const setActionLoading = (state) => { state.actionLoading = true; state.error = null; };
    const clearActionLoading = (state) => { state.actionLoading = false; };

    builder
      // Fetch my projects
      .addCase(fetchMyProjects.pending, setLoading)
      .addCase(fetchMyProjects.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.projects = payload.projects;
        state.total = payload.total;
        state.totalPages = payload.totalPages;
        state.currentPage = payload.currentPage;
      })
      .addCase(fetchMyProjects.rejected, setError)

      // Fetch all
      .addCase(fetchAllProjects.pending, setLoading)
      .addCase(fetchAllProjects.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.projects = payload.projects;
        state.total = payload.total;
        state.totalPages = payload.totalPages;
        state.currentPage = payload.currentPage;
      })
      .addCase(fetchAllProjects.rejected, setError)

      // Fetch single
      .addCase(fetchProjectById.pending, setLoading)
      .addCase(fetchProjectById.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.currentProject = payload.project;
      })
      .addCase(fetchProjectById.rejected, setError)

      // Create
      .addCase(createProject.pending, setActionLoading)
      .addCase(createProject.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.projects.unshift(payload.project);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateProject.pending, setActionLoading)
      .addCase(updateProject.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        const idx = state.projects.findIndex((p) => p._id === payload.project._id);
        if (idx !== -1) state.projects[idx] = payload.project;
        if (state.currentProject?._id === payload.project._id) state.currentProject = payload.project;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Delete/cancel
      .addCase(deleteProject.pending, setActionLoading)
      .addCase(deleteProject.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.projects = state.projects.filter((p) => p._id !== payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Applications
      .addCase(fetchProjectApplications.pending, setLoading)
      .addCase(fetchProjectApplications.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.applications = payload.applications;
      })
      .addCase(fetchProjectApplications.rejected, setError)

      // Update application status
      .addCase(updateApplicationStatus.pending, setActionLoading)
      .addCase(updateApplicationStatus.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        const idx = state.applications.findIndex((a) => a._id === payload.application._id);
        if (idx !== -1) state.applications[idx] = payload.application;
        // Reflect status change in currentProject if loaded
        if (state.currentProject && payload.application.status === 'Approved') {
          state.currentProject.status = 'In Progress';
        }
      })
      .addCase(updateApplicationStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Complete
      .addCase(markProjectCompleted.pending, setActionLoading)
      .addCase(markProjectCompleted.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        if (state.currentProject?._id === payload.project._id) state.currentProject = payload.project;
        const idx = state.projects.findIndex((p) => p._id === payload.project._id);
        if (idx !== -1) state.projects[idx] = payload.project;
      })
      .addCase(markProjectCompleted.rejected, clearActionLoading)

      // Revision
      .addCase(requestRevision.pending, setActionLoading)
      .addCase(requestRevision.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        if (state.currentProject?._id === payload.project._id) state.currentProject = payload.project;
      })
      .addCase(requestRevision.rejected, clearActionLoading)

      // Stats
      .addCase(fetchClientStats.pending, setLoading)
      .addCase(fetchClientStats.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.stats = payload.stats;
      })
      .addCase(fetchClientStats.rejected, setError);
  },
});

export const { clearProjectError, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
