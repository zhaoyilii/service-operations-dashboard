CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL,
  description varchar(240) NOT NULL DEFAULT '',
  owner varchar(80) NOT NULL,
  status varchar(20) NOT NULL CHECK (status IN ('operational', 'degraded', 'outage', 'maintenance')),
  environment varchar(20) NOT NULL
  CHECK (
    environment IN (
      'production',
      'staging',
      'development'
    )
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(120) NOT NULL,
  description varchar(500) NOT NULL DEFAULT '',
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  severity varchar(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status varchar(20) NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_status_idx ON services(status);
CREATE INDEX IF NOT EXISTS incidents_service_idx ON incidents(service_id);
CREATE INDEX IF NOT EXISTS incidents_status_severity_idx ON incidents(status, severity);
