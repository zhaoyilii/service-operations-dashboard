import type { DashboardSummary, Incident, IncidentInput, Page, Service, ServiceInput } from '@service-ops/shared';

const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ message: response.statusText }));

    throw new Error(body.message ?? 'Request failed');
  }

  return response.status === 204
    ? undefined as T
    : response.json();
}

const query = (values: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== '') p.set(key, String(value));
  // Object.entries(values)把对象转化为键值对
  // if (value !== undefined && value !== '') 忽略空字符串
  return p.toString(); //转成字符串 得到 search=Payments&page=1&pageSize=8
};

export const api = {
  summary: () => request<DashboardSummary>('/api/summary'),
  services: (filters: Record<string, string | number | undefined> = {}) => request<Page<Service>>(`/api/services?${query(filters)}`), 
  //将刚才产生的 search=Payments&page=1&pageSize=8 拼到URL中 于是产生 /api/services?search=Payments&page=1&pageSize=8
  incidents: (filters: Record<string, string | number | undefined> = {}) => request<Page<Incident>>(`/api/incidents?${query(filters)}`),
  createService: (data: ServiceInput) => request<Service>('/api/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id: string, data: ServiceInput) => request<Service>(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id: string) => request<void>(`/api/services/${id}`, { method: 'DELETE' }),
  createIncident: (data: IncidentInput) => request<Incident>('/api/incidents', { method: 'POST', body: JSON.stringify(data) }),
  updateIncident: (id: string, data: IncidentInput) => request<Incident>(`/api/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIncident: (id: string) => request<void>(`/api/incidents/${id}`, { method: 'DELETE' }),
};
