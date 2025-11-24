const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function apiRequest(path, { method = 'GET', body, token, headers } = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  };
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}${path}`, options);
  const handleInvalidToken = () => {
    try {
      localStorage.removeItem('arcdraft_token');
      localStorage.removeItem('arcdraft_user');
    } catch (err) {
      console.error('Failed to clear auth session', err);
    }
  };
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text || '{}');
      const message = parsed.message || 'Request failed';
      if (res.status === 401 && message.toLowerCase().includes('invalid token')) {
        handleInvalidToken();
        throw new Error('Session abgelaufen. Bitte erneut einloggen.');
      }
      throw new Error(message);
    } catch (err) {
      if (res.status === 401 && text.toLowerCase().includes('invalid token')) {
        handleInvalidToken();
        throw new Error('Session abgelaufen. Bitte erneut einloggen.');
      }
      throw new Error(text || 'Request failed');
    }
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export { apiRequest, API_URL };
