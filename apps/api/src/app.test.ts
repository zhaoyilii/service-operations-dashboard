import { 
  afterEach, // 每个测试之后执行
  beforeEach, // 每个测试之前执行；
  describe, // 把相关测试归为一组；
  expect, // 检查实际结果是否符合预期；
  it // 定义一个具体测试；
} from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { MemoryStore } from './store.js';

describe('service operations API', () => {
  let app: FastifyInstance;
  beforeEach(async () => { app = await buildApp(new MemoryStore()); });
  // 每一个测试都会创建新的 Fastify 和 MemoryStore，避免测试之间相互影响
  //测试使用memoryStore，不会修改真实的数据库
  afterEach(async () => app.close());

  it('filters and paginates services', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/services?status=operational&pageSize=1' }); //模拟一次 HTTP 请求。
    // 不会真的打开浏览器，也不需要监听 3001 端口。请求会直接进入 Fastify。
    expect(response.statusCode).toBe(200); //检查状态码
    expect(response.json()).toMatchObject({ total: 2, pageSize: 1, totalPages: 2 }); //toMatchObject() 只检查列出的字段
  });

  it('validates service creation', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/services', payload: { name: '', owner: 'A', status: 'broken' } });
    expect(response.statusCode).toBe(400); //确认后端能够拒绝非法数据
  });

  it('creates and resolves an incident', async () => {
    const payload = { title: 'Checkout timeout', description: 'Synthetic test incident', serviceId: '22222222-2222-4222-8222-222222222222', severity: 'high', status: 'investigating' };
    const created = await app.inject({ method: 'POST', url: '/api/incidents', payload });
    expect(created.statusCode).toBe(201);
    const updated = await app.inject({ method: 'PUT', url: `/api/incidents/${created.json().id}`, payload: { ...payload, status: 'resolved' } });
    expect(updated.json().status).toBe('resolved');
  });

  it('deletes an incident', async () => {
  const payload = {
    title: 'Temporary incident',
    description: 'Created for a deletion test',
    serviceId: '22222222-2222-4222-8222-222222222222',
    severity: 'high',
    status: 'investigating'
  };

  const created = await app.inject({
    method: 'POST',
    url: '/api/incidents',
    payload
  });

  expect(created.statusCode).toBe(201);

  const incidentId = created.json().id;

  const deleted = await app.inject({
    method: 'DELETE',
    url: `/api/incidents/${incidentId}`
  });

  expect(deleted.statusCode).toBe(204);

  const missing = await app.inject({
    method: 'GET',
    url: `/api/incidents/${incidentId}`
  });

  expect(missing.statusCode).toBe(404);
});
});
