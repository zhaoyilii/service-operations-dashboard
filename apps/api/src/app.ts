import Fastify from 'fastify';
import cors from '@fastify/cors';
import { incidentInputSchema, incidentQuerySchema, serviceInputSchema, serviceQuerySchema } from '@service-ops/shared';
import type { Store } from './store.js';

export async function buildApp(store: Store) {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });
  await app.register(cors, {
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});
  app.addHook('onClose', () => store.close());

  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/api/summary', () => store.summary());
  app.get('/api/services', async req => store.listServices(serviceQuerySchema.parse(req.query)));
  // Fastify把URL中的参数解析到 req.query  刚解析出来时 它们都是字符串
  // serviceQuerySchema会将这些参数转换为正确的类型
  app.get<{Params:{id:string}}>('/api/services/:id', async (req, reply) => (await store.getService(req.params.id)) ?? reply.code(404).send({ message: 'Service not found' }));
  app.post('/api/services', async (req, reply) => reply.code(201).send(await store.createService(serviceInputSchema.parse(req.body))));
  app.put<{Params:{id:string}}>('/api/services/:id', async (req, reply) => (await store.updateService(req.params.id, serviceInputSchema.parse(req.body))) ?? reply.code(404).send({ message: 'Service not found' }));
  app.delete<{Params:{id:string}}>('/api/services/:id', async (req, reply) => { try { return (await store.deleteService(req.params.id)) ? reply.code(204).send() : reply.code(404).send({message:'Service not found'}); } catch(e) { if ((e as Error).message === 'SERVICE_HAS_INCIDENTS') return reply.code(409).send({message:'Resolve or delete linked incidents first'}); throw e; } });

  app.get('/api/incidents', async req => store.listIncidents(incidentQuerySchema.parse(req.query)));
  app.get<{Params:{id:string}}>('/api/incidents/:id', async (req, reply) => (await store.getIncident(req.params.id)) ?? reply.code(404).send({ message: 'Incident not found' }));
  app.post('/api/incidents', async (req, reply) => reply.code(201).send(await store.createIncident(incidentInputSchema.parse(req.body))));
  app.put<{Params:{id:string}}>('/api/incidents/:id', async (req, reply) => (await store.updateIncident(req.params.id, incidentInputSchema.parse(req.body))) ?? reply.code(404).send({ message: 'Incident not found' }));
  app.delete<{Params:{id:string}}>('/api/incidents/:id', async (req, reply) => (await store.deleteIncident(req.params.id)) ? reply.code(204).send() : reply.code(404).send({message:'Incident not found'}));

  app.setErrorHandler((error, _req, reply) => {
    const issue = (error as {issues?: unknown}).issues;
    if (issue) return reply.code(400).send({ message: 'Validation failed', issues: issue });
    if ((error as {code?:string}).code === '23503') return reply.code(400).send({message:'Referenced service does not exist'});
    app.log.error(error); return reply.code(500).send({message:'Unexpected server error'});
  });
  return app;
}
