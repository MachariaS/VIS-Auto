export interface ApiError extends Error {
  status: number;
  path: string;
}

export async function request<T = any>(
  baseUrl: string,
  path: string,
  body?: unknown,
  method = 'POST',
  token?: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
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
  let data: any;
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
    ) as ApiError;
    error.status = response.status;
    error.path = path;
    throw error;
  }

  return data as T;
}
