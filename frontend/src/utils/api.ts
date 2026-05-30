const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export function apiPath(path: string) {
  if (!apiBaseUrl) {
    return path;
  }

  const normalizedBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}
