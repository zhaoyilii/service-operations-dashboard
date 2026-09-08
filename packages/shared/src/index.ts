import { z } from 'zod';

export const serviceStatuses = ['operational', 'degraded', 'outage', 'maintenance'] as const;
//status表示当前服务是否健康
export const serviceEnvironments = [
  'production',
  'staging',
  'development'
] as const; //environment表示服务部署在哪
export const incidentSeverities = ['low', 'medium', 'high', 'critical'] as const;
export const incidentStatuses = ['investigating', 'identified', 'monitoring', 'resolved'] as const;

export const serviceInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).default(''),
  owner: z.string().trim().min(2).max(80),
  status: z.enum(serviceStatuses),
  environment: z.enum(serviceEnvironments),
});

export const incidentInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).default(''),
  serviceId: z.string().uuid(),
  severity: z.enum(incidentSeverities),
  status: z.enum(incidentStatuses),
});

export const serviceQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  status: z.enum(serviceStatuses).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(8),
});

export const incidentQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  severity: z.enum(incidentSeverities).optional(),
  status: z.enum(incidentStatuses).optional(),
  serviceId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(8),
  //coerce 表示尝试转换类型（'1' -> 1） 同时Schema还会有一些格式规定
});

export type ServiceInput = z.infer<typeof serviceInputSchema>;
export type IncidentInput = z.infer<typeof incidentInputSchema>;
export type ServiceStatus = (typeof serviceStatuses)[number];
export type IncidentSeverity = (typeof incidentSeverities)[number];
export type IncidentStatus = (typeof incidentStatuses)[number];

export interface Service extends ServiceInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident extends IncidentInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DashboardSummary {
  serviceCount: number;
  operationalCount: number;
  activeIncidentCount: number;
  criticalIncidentCount: number;
}
