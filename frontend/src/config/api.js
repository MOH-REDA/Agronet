export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
export const API_URL = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;
export const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || `${BACKEND_URL}/storage`;

export const getPublicMediaUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('/')) return path;
  try {
    const url = new URL(path);
    if (url.hostname === window.location.hostname) return `${url.pathname}${url.search}`;
    return url.href;
  } catch {
    return `/${path.replace(/^\/+/, '')}`;
  }
};

export const getStorageUrl = (path) => {
  if (!path || typeof path !== 'string') {
    return '';
  }

  let normalizedPath = path.replace(/\\/g, '/').trim().replace(/^\/+/, '');

  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith('storage/')) {
    normalizedPath = normalizedPath.substring('storage/'.length);
  }

  if (!normalizedPath.startsWith('equipment/')) {
    normalizedPath = `equipment/${normalizedPath}`;
  }

  return `${STORAGE_URL}/${normalizedPath}`;
};
