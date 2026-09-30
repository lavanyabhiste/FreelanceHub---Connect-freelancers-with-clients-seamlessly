import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import store from './store';
import { setUnauthorizedHandler } from './services/api';
import { localLogout } from './slices/authSlice';

// Styling Imports
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import App from './App.jsx';

// Any authenticated API call that returns 401 (expired/revoked token) clears
// the session globally — PrivateRoute then redirects to /login.
setUnauthorizedHandler(() => {
  store.dispatch(localLogout());
  toast.warn('Your session has expired. Please log in again.');
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <ToastContainer position="top-right" autoClose={3000} />
    </Provider>
  </StrictMode>
);
