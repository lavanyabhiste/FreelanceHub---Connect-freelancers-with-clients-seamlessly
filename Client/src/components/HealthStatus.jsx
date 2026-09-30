import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServerHealth } from '../slices/appSlice';
import {
  CheckCircleOutlined as CheckCircleOutlineIcon,
  ErrorOutlined as ErrorOutlineIcon,
  Refresh as RefreshIcon,
  Dns as DnsIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';

export default function HealthStatus() {
  const dispatch = useDispatch();
  const { healthData, healthLoading, healthError } = useSelector((state) => state.app);

  useEffect(() => {
    dispatch(fetchServerHealth());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchServerHealth());
  };

  return (
    <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <DnsIcon className="text-primary" />
          <h5 className="mb-0 fw-bold">Backend Health Check</h5>
        </div>
        <button
          className="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-1"
          onClick={handleRefresh}
          disabled={healthLoading}
        >
          <RefreshIcon fontSize="small" className={healthLoading ? 'spin' : ''} />
          {healthLoading ? 'Checking...' : 'Re-check'}
        </button>
      </div>

      <p className="text-muted small mb-3">
        Endpoint: <code className="text-primary bg-light px-2 py-1 rounded">GET /api/health</code>
      </p>

      {healthLoading && !healthData && (
        <div className="d-flex align-items-center gap-2 text-muted py-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
          <span>Connecting to FreelanceHub API...</span>
        </div>
      )}

      {healthError && (
        <div className="alert alert-warning border-0 rounded-3 d-flex align-items-start gap-2 mb-0">
          <ErrorOutlineIcon className="text-warning mt-1" />
          <div>
            <strong>Backend Unreachable:</strong>
            <p className="mb-0 small">{healthError}</p>
            <small className="text-muted">
              Make sure the server is running on port 5000 (<code>npm run dev</code> inside <code>Server/</code>).
            </small>
          </div>
        </div>
      )}

      {healthData && (
        <div className="health-details">
          <div className="d-flex align-items-center gap-2 text-success mb-3">
            <CheckCircleOutlineIcon />
            <span className="fw-semibold">{healthData.message}</span>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="p-3 bg-light rounded-3 text-center">
                <small className="text-muted d-block">Environment</small>
                <span className="fw-bold text-dark text-capitalize">{healthData.environment}</span>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-3 bg-light rounded-3 text-center">
                <small className="text-muted d-block">Server Uptime</small>
                <span className="fw-bold text-dark">{healthData.uptime}</span>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-3 bg-light rounded-3 text-center">
                <small className="text-muted d-block">
                  <StorageIcon fontSize="inherit" className="me-1" />
                  MongoDB Status
                </small>
                <span
                  className={`badge rounded-pill ${
                    healthData.database?.status === 'Connected' ? 'bg-success' : 'bg-secondary'
                  }`}
                >
                  {healthData.database?.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
