import { randomUUID } from 'node:crypto';
import type { DashboardSummary, Incident, IncidentInput, Page, Service, ServiceInput } from '@service-ops/shared';
import type { Pool } from 'pg';

export interface ListOptions {
  search?: string;
  status?: string;
  severity?: string;
  serviceId?: string;
  page: number;
  pageSize: number;
}

export interface Store {
  listServices(options: ListOptions): Promise<Page<Service>>;
  getService(id: string): Promise<Service | undefined>;
  createService(input: ServiceInput): Promise<Service>;
  updateService(id: string, input: ServiceInput): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;
  listIncidents(options: ListOptions): Promise<Page<Incident>>;
  getIncident(id: string): Promise<Incident | undefined>;
  createIncident(input: IncidentInput): Promise<Incident>;
  updateIncident(id: string, input: IncidentInput): Promise<Incident | undefined>;
  deleteIncident(id: string): Promise<boolean>;
  summary(): Promise<DashboardSummary>;
  close(): Promise<void>;
}

const now = () => new Date().toISOString();
const pageOf = <T>(items: T[], page: number, pageSize: number): Page<T> => ({
  items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize,
  total: items.length, totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
});

const serviceSeeds: Service[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Customer Portal', description: 'Account and billing experience', owner: 'Web Platform', status: 'operational', environment: 'production', createdAt: '2026-08-20T14:00:00.000Z', updatedAt: '2026-08-27T13:20:00.000Z' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Payments API', description: 'Payment authorization and settlement', owner: 'Commerce', status: 'degraded', environment: 'production', createdAt: '2026-08-19T14:00:00.000Z', updatedAt: '2026-08-27T12:45:00.000Z' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Notification Worker', description: 'Transactional email and SMS delivery', owner: 'Messaging', status: 'maintenance', environment: 'staging', createdAt: '2026-08-18T14:00:00.000Z', updatedAt: '2026-08-27T11:30:00.000Z' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Identity Service', description: 'Authentication and session management', owner: 'Security', status: 'operational', environment: 'development', createdAt: '2026-08-17T14:00:00.000Z', updatedAt: '2026-08-27T09:10:00.000Z' },
];

const incidentSeeds: Incident[] = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Elevated payment latency', description: 'P95 latency above 1.5 seconds in us-east.', serviceId: serviceSeeds[1].id, severity: 'high', status: 'monitoring', createdAt: '2026-08-27T12:20:00.000Z', updatedAt: '2026-08-27T13:04:00.000Z' },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'SMS delivery delay', description: 'Provider maintenance is delaying some messages.', serviceId: serviceSeeds[2].id, severity: 'medium', status: 'identified', createdAt: '2026-08-27T10:50:00.000Z', updatedAt: '2026-08-27T11:15:00.000Z' },
  { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', title: 'Login redirect loop', description: 'Resolved configuration regression.', serviceId: serviceSeeds[3].id, severity: 'critical', status: 'resolved', createdAt: '2026-08-26T19:10:00.000Z', updatedAt: '2026-08-26T20:00:00.000Z' },
];

export class MemoryStore implements Store {
  private services = structuredClone(serviceSeeds);
  private incidents = structuredClone(incidentSeeds);

  async listServices(o: ListOptions) { // Zod转换后的query参数暂存至参数o中
    const q = o.search?.toLowerCase() ?? '';
    const items = this.services.filter(s => (!q || `${s.name} ${s.owner} ${s.description}`.toLowerCase().includes(q)) && (!o.status || s.status === o.status));
    // !q 表示没有搜索词
    // `${s.name} ${s.owner} ${s.description}` 把所有东西拆在一起 且转小写
    // || 说明没有搜索词，或者当前Service包含搜索词 结果为true
    // !o.status没有选择状态
    // 没有状态筛选，或者当前Service的状态等于所选状态 结果为true
    // && 表示必须同时符合搜索词和符合状态筛选 
    return pageOf(items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), o.page, o.pageSize);
  }
  async getService(id: string) { return this.services.find(s => s.id === id); }
  async createService(input: ServiceInput) {
    const stamp = now(); const item = { ...input, id: randomUUID(), createdAt: stamp, updatedAt: stamp };
    this.services.unshift(item); return item;
  }
  async updateService(id: string, input: ServiceInput) {
    const i = this.services.findIndex(s => s.id === id); if (i < 0) return undefined;
    this.services[i] = { ...this.services[i], ...input, updatedAt: now() }; return this.services[i];
  }
  async deleteService(id: string) {
    if (this.incidents.some(i => i.serviceId === id)) throw new Error('SERVICE_HAS_INCIDENTS');
    const before = this.services.length; this.services = this.services.filter(s => s.id !== id); return before !== this.services.length;
  }
  async listIncidents(o: ListOptions) {
    const q = o.search?.toLowerCase() ?? '';
    const items = this.incidents.filter(i => (!q || `${i.title} ${i.description}`.toLowerCase().includes(q)) && (!o.status || i.status === o.status) && (!o.severity || i.severity === o.severity) && (!o.serviceId || i.serviceId === o.serviceId));
    return pageOf(items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), o.page, o.pageSize);
  }
  async getIncident(id: string) { return this.incidents.find(i => i.id === id); }
  async createIncident(input: IncidentInput) {
    const stamp = now(); const item = { ...input, id: randomUUID(), createdAt: stamp, updatedAt: stamp };
    this.incidents.unshift(item); return item;
  }
  async updateIncident(id: string, input: IncidentInput) {
    const i = this.incidents.findIndex(x => x.id === id); if (i < 0) return undefined;
    this.incidents[i] = { ...this.incidents[i], ...input, updatedAt: now() }; return this.incidents[i];
  }
  async deleteIncident(id: string) { const before = this.incidents.length; this.incidents = this.incidents.filter(i => i.id !== id); return before !== this.incidents.length; }
  async summary() {
    return { serviceCount: this.services.length, operationalCount: this.services.filter(s => s.status === 'operational').length, activeIncidentCount: this.incidents.filter(i => i.status !== 'resolved').length, criticalIncidentCount: this.incidents.filter(i => i.status !== 'resolved' && i.severity === 'critical').length };
  }
  async close() {}
}

type DbRow = Record<string, unknown>;
const serviceFromDb = (r: DbRow): Service => ({ id: String(r.id), name: String(r.name), description: String(r.description), owner: String(r.owner), status: r.status as Service['status'], environment: r.environment as Service['environment'], createdAt: new Date(r.created_at as string).toISOString(), updatedAt: new Date(r.updated_at as string).toISOString() }); //把PostgreSQL返回的数据库行转换成项目中的Service对象
const incidentFromDb = (r: DbRow): Incident => ({ id: String(r.id), title: String(r.title), description: String(r.description), serviceId: String(r.service_id), severity: r.severity as Incident['severity'], status: r.status as Incident['status'], createdAt: new Date(r.created_at as string).toISOString(), updatedAt: new Date(r.updated_at as string).toISOString() });

export class PostgresStore implements Store {
  constructor(private pool: Pool) {}
  async listServices(o: ListOptions) {
    const values: unknown[] = []; const where: string[] = [];
    if (o.search) { values.push(`%${o.search}%`); where.push(`(name ILIKE $${values.length} OR owner ILIKE $${values.length} OR description ILIKE $${values.length})`); }
    if (o.status) { values.push(o.status); where.push(`status = $${values.length}`); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const count = await this.pool.query(`SELECT count(*) FROM services ${clause}`, values);
    values.push(o.pageSize, (o.page - 1) * o.pageSize);
    const rows = await this.pool.query(`SELECT * FROM services ${clause} ORDER BY updated_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    const total = Number(count.rows[0].count); return { items: rows.rows.map(serviceFromDb), page: o.page, pageSize: o.pageSize, total, totalPages: Math.max(1, Math.ceil(total / o.pageSize)) };
  }
  async getService(id: string) { const r = await this.pool.query('SELECT * FROM services WHERE id=$1', [id]); return r.rows[0] ? serviceFromDb(r.rows[0]) : undefined; }
  async createService(i: ServiceInput) { const r = await this.pool.query('INSERT INTO services(name,description,owner,status,environment) VALUES($1,$2,$3,$4,$5) RETURNING *', [i.name,i.description,i.owner,i.status, i.environment]); return serviceFromDb(r.rows[0]); }
  async updateService(id: string, i: ServiceInput) { const r = await this.pool.query('UPDATE services SET name=$2,description=$3,owner=$4,status=$5,updated_at=now() WHERE id=$1 RETURNING *', [id,i.name,i.description,i.owner,i.status]); return r.rows[0] ? serviceFromDb(r.rows[0]) : undefined; }
  async deleteService(id: string) { try { return (await this.pool.query('DELETE FROM services WHERE id=$1', [id])).rowCount === 1; } catch (e) { if ((e as {code?:string}).code === '23503') throw new Error('SERVICE_HAS_INCIDENTS'); throw e; } }
  async listIncidents(o: ListOptions) {
    const values: unknown[] = []; const where: string[] = [];
    if (o.search) { values.push(`%${o.search}%`); where.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length})`); }
    for (const [column, value] of [['status',o.status],['severity',o.severity],['service_id',o.serviceId]]) if (value) { values.push(value); where.push(`${column} = $${values.length}`); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const count = await this.pool.query(`SELECT count(*) FROM incidents ${clause}`, values);
    values.push(o.pageSize, (o.page - 1) * o.pageSize);
    const rows = await this.pool.query(`SELECT * FROM incidents ${clause} ORDER BY updated_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    const total = Number(count.rows[0].count); return { items: rows.rows.map(incidentFromDb), page:o.page, pageSize:o.pageSize, total, totalPages:Math.max(1,Math.ceil(total/o.pageSize)) };
  }
  async getIncident(id: string) { const r=await this.pool.query('SELECT * FROM incidents WHERE id=$1',[id]); return r.rows[0]?incidentFromDb(r.rows[0]):undefined; }
  async createIncident(i: IncidentInput) { const r=await this.pool.query('INSERT INTO incidents(title,description,service_id,severity,status) VALUES($1,$2,$3,$4,$5) RETURNING *',[i.title,i.description,i.serviceId,i.severity,i.status]); return incidentFromDb(r.rows[0]); }
  async updateIncident(id:string,i:IncidentInput) { const r=await this.pool.query('UPDATE incidents SET title=$2,description=$3,service_id=$4,severity=$5,status=$6,updated_at=now() WHERE id=$1 RETURNING *',[id,i.title,i.description,i.serviceId,i.severity,i.status]); return r.rows[0]?incidentFromDb(r.rows[0]):undefined; }
  async deleteIncident(id:string) { return (await this.pool.query('DELETE FROM incidents WHERE id=$1',[id])).rowCount===1; }
  async summary() { const r=await this.pool.query(`SELECT (SELECT count(*) FROM services)::int service_count,(SELECT count(*) FROM services WHERE status='operational')::int operational_count,(SELECT count(*) FROM incidents WHERE status<>'resolved')::int active_incident_count,(SELECT count(*) FROM incidents WHERE status<>'resolved' AND severity='critical')::int critical_incident_count`); const x=r.rows[0]; return {serviceCount:x.service_count,operationalCount:x.operational_count,activeIncidentCount:x.active_incident_count,criticalIncidentCount:x.critical_incident_count}; }
  async close() { await this.pool.end(); }
}
