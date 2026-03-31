import { Navigate } from 'react-router-dom';
import { isLoggedIn, getRole } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isLoggedIn()) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(getRole())) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;