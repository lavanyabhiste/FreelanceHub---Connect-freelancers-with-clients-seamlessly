import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../slices/authSlice';

/**
 * Custom hook to access authentication status, user details, and role checks
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const role = auth.role ? auth.role.toLowerCase() : null;

  return {
    user: auth.user,
    token: auth.token,
    role: auth.role,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    isClient: role === 'client',
    isFreelancer: role === 'freelancer',
    isAdmin: role === 'admin',
    logout: () => dispatch(logoutUser()),
  };
};

export default useAuth;
