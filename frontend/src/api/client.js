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
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export { apiRequest, API_URL };
