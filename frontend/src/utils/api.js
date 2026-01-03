export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      }
    } catch (error) {
      message = response.statusText || message;
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function checkAuth() {
  const response = await fetch('/api/auth-check', {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(`Auth check failed with status: ${response.status}`);
  }
  return response.json();
}
