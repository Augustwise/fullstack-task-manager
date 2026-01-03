import { useEffect, useState } from 'react';

export default function useAuthStatus() {
  const [state, setState] = useState({
    loading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth-check')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Auth check failed: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!isMounted) return;
        setState({ loading: false, isAuthenticated: Boolean(data.isAuthenticated) });
      })
      .catch(() => {
        if (!isMounted) return;
        setState({ loading: false, isAuthenticated: false });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
