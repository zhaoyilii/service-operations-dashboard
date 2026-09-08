import { describe, expect, it } from 'vitest';
import { incidentInputSchema, serviceInputSchema } from './index.js';

describe('shared validation', () => {
  it('normalizes a valid service', () => {
    // Arrange + Act：准备输入并运行Schema
    const result = serviceInputSchema.parse({ name: ' API ', owner: ' Platform ', status: 'operational', environment: 'production' });
    // Assert：验证结果
    expect(result).toEqual({ name: 'API', owner: 'Platform', status: 'operational', environment: 'production', description: '' });
  });

  it('rejects an invalid incident service id', () => {
    const result = incidentInputSchema.safeParse({
      title: 'API errors', description: '', serviceId: 'not-an-id', severity: 'high', status: 'investigating'
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid service environment', () => {
  const result = serviceInputSchema.safeParse({
    name: 'Search API',
    description: '',
    owner: 'Platform',
    status: 'operational',
    environment: 'test-server'
  });

  expect(result.success).toBe(false);
  });
});
