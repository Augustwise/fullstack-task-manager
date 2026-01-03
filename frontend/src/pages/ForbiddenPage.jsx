import { Link } from 'react-router-dom';
import '../styles/403.css';

export default function ForbiddenPage() {
  return (
    <div className="page-403">
      <div className="container">
        <h1 className="error-code">403</h1>
        <p className="error-message">Forbidden - Access Denied</p>
        <p>You do not have permission to access this resource.</p>
        <Link to="/" className="home-link">
          Go Home
        </Link>
      </div>
    </div>
  );
}
