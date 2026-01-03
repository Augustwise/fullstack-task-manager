import { useLocation } from 'react-router-dom';
import ForbiddenPage from './ForbiddenPage.jsx';
import NotFoundPage from './NotFoundPage.jsx';

const forbiddenPrefixes = ['/package.json', '/package-lock.json', '/backend', '/.env'];

export default function CatchAllPage() {
  const location = useLocation();
  const lowerPath = location.pathname.toLowerCase();
  const isForbidden = forbiddenPrefixes.some((prefix) => lowerPath.startsWith(prefix));

  return isForbidden ? <ForbiddenPage /> : <NotFoundPage />;
}
