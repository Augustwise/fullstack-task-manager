import { Link } from 'react-router-dom';
import '../styles/404.css';

export default function NotFoundPage() {
  return (
    <div className="page-404">
      <div className="container">
        <h1 className="error-code">404</h1>
        <p className="error-message">Page Not Found</p>
        <p>Sorry, the page you are looking for does not exist.</p>
        <Link to="/" className="home-link">
          Go Home
        </Link>
      </div>
    </div>
  );
}
