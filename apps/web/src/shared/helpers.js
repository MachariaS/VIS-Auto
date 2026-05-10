import { API_BASE, serviceImageByCode } from './constants';

// Web-compatible request: keeps existing call sites unchanged (path first, not baseUrl first)
export async function request(path, body, method = 'POST', token, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || `Request failed (${response.status})`,
    );
    error.status = response.status;
    error.path = path;
    throw error;
  }

  return data;
}

export function getApiUrl(path) {
  return `${API_BASE}${path}`;
}

export function getServiceImageUrl(service) {
  if (!service) {
    return '/assets/other_services.jpeg';
  }
  const code = service.catalogCode || service.serviceCode;
  return (
    service.serviceImageUrl ||
    serviceImageByCode[code] ||
    '/assets/other_services.jpeg'
  );
}
