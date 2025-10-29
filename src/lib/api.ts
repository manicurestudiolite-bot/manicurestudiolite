const API_BASE = '/api';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    register: (data: { name: string; email: string; password: string }) =>
      fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => fetchAPI('/auth/logout', { method: 'POST' }),
    refresh: () => fetchAPI('/auth/refresh', { method: 'POST' }),
    me: () => fetchAPI('/auth/me'),
  },

  // Clients
  clients: {
    list: () => fetchAPI('/clients'),
    create: (data: any) => fetchAPI('/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/clients/${id}`, { method: 'DELETE' }),
    history: (id: string) => fetchAPI(`/clients/${id}/history`),
  },

  // Services
  services: {
    list: () => fetchAPI('/services'),
    create: (data: any) => fetchAPI('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/services/${id}`, { method: 'DELETE' }),
  },

  // Products
  products: {
    list: () => fetchAPI('/products'),
    create: (data: any) => fetchAPI('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/products/${id}`, { method: 'DELETE' }),
    adjust: (id: string, data: { delta: number; reason?: string }) =>
      fetchAPI(`/products/${id}/adjust`, { method: 'POST', body: JSON.stringify(data) }),
    history: (id: string) => fetchAPI(`/products/${id}/history`),
  },

  // Appointments
  appointments: {
    list: (params?: { startDate?: string; endDate?: string }) => {
      const query = params
        ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
        : '';
      return fetchAPI(`/appointments${query}`);
    },
    create: (data: any) =>
      fetchAPI('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      fetchAPI(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    delete: (id: string) => fetchAPI(`/appointments/${id}`, { method: 'DELETE' }),
  },

  // Push
  push: {
    subscribe: (subscription: any) =>
      fetchAPI('/push/subscribe', { method: 'POST', body: JSON.stringify(subscription) }),
    unsubscribe: (endpoint: string) =>
      fetchAPI('/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),
    vapidKey: () => fetchAPI('/push/vapid-key'),
  },

  // Settings
  settings: {
    get: () => fetchAPI('/settings/me'),
    update: (data: any) =>
      fetchAPI('/settings/me', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Reports
  reports: {
    revenue: (params?: { period?: string; startDate?: string; endDate?: string }) => {
      const query = params
        ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
        : '';
      return fetchAPI(`/reports/revenue${query}`);
    },
    topServices: (params?: { startDate?: string; endDate?: string }) => {
      const query = params
        ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
        : '';
      return fetchAPI(`/reports/top-services${query}`);
    },
    topClients: (params?: { startDate?: string; endDate?: string }) => {
      const query = params
        ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
        : '';
      return fetchAPI(`/reports/top-clients${query}`);
    },
    lowStock: () => fetchAPI('/reports/low-stock'),
  },

  // Health
  health: () => fetchAPI('/health'),
};
