-- =====================================================
-- GatePass Database Schema (from scratch, aligned with frontend)
-- =====================================================
-- Paste this entire file in the Supabase SQL Editor and run.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional reset for development: drop existing objects in dependency order
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications') THEN
    DROP TABLE IF EXISTS notifications CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='approvals') THEN
    DROP TABLE IF EXISTS approvals CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gatepass_requests') THEN
    DROP TABLE IF EXISTS gatepass_requests CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='students') THEN
    DROP TABLE IF EXISTS students CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='parents') THEN
    DROP TABLE IF EXISTS parents CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wardens') THEN
    DROP TABLE IF EXISTS wardens CASCADE;
  END IF;
END $$;

-- =====================================================
-- Core Entities
-- =====================================================

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  roll_number TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wardens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- GatePass Requests
-- =====================================================

CREATE TABLE gatepass_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Links
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  warden_id UUID REFERENCES wardens(id) ON DELETE SET NULL,

  -- Denormalized for convenient frontend reads
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  student_email TEXT,
  parent_email TEXT,

  -- Details
  reason TEXT NOT NULL,
  destination TEXT,
  departure_date_time TIMESTAMPTZ NOT NULL,
  return_date_time TIMESTAMPTZ,

  -- Backward-compatibility fields (existing frontend may use these)
  purpose TEXT,
  departure_datetime TIMESTAMPTZ,
  duration TEXT,

  -- Workflow
  status TEXT NOT NULL DEFAULT 'Pending Parent Approval' CHECK (
    status IN (
      'Pending Parent Approval',
      'Approved by Parent',
      'Rejected by Parent',
      'Warden Approved',
      'Warden Denied',
      'Completed'
    )
  ),
  parent_approval_token TEXT UNIQUE,
  parent_approved_at TIMESTAMPTZ,
  parent_rejection_reason TEXT,
  warden_approved_at TIMESTAMPTZ,
  warden_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gatepass_student_id ON gatepass_requests(student_id);
CREATE INDEX idx_gatepass_status ON gatepass_requests(status);
CREATE INDEX idx_gatepass_departure ON gatepass_requests(departure_date_time DESC);

-- =====================================================
-- Approvals and Notifications
-- =====================================================

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES gatepass_requests(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('parent','warden')),
  actor_id UUID,
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected')),
  reason TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_approvals_request ON approvals(request_id);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES gatepass_requests(id) ON DELETE CASCADE,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('parent','warden','student')),
  recipient_email TEXT,
  type TEXT NOT NULL CHECK (type IN ('parent_request','parent_decision','warden_notification')),
  payload JSONB,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_request ON notifications(request_id);

-- =====================================================
-- Triggers
-- =====================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_students_updated
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_parents_updated
BEFORE UPDATE ON parents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_wardens_updated
BEFORE UPDATE ON wardens
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_requests_updated
BEFORE UPDATE ON gatepass_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Keep compatibility fields in sync on INSERT
CREATE OR REPLACE FUNCTION sync_request_compat_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.purpose IS NULL THEN
    NEW.purpose = NEW.reason;
  END IF;
  IF NEW.departure_datetime IS NULL THEN
    NEW.departure_datetime = NEW.departure_date_time;
  END IF;
  IF NEW.duration IS NULL AND NEW.return_date_time IS NOT NULL THEN
    NEW.duration = CONCAT(EXTRACT(EPOCH FROM (NEW.return_date_time - NEW.departure_date_time))::INT, 's');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_requests_sync
BEFORE INSERT ON gatepass_requests
FOR EACH ROW EXECUTE FUNCTION sync_request_compat_fields();

-- Generate parent approval token on INSERT (if not set)
CREATE OR REPLACE FUNCTION set_parent_approval_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_approval_token IS NULL THEN
    NEW.parent_approval_token = encode(digest(NEW.id::text || ':' || NOW()::text, 'sha256'), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_requests_token
BEFORE INSERT ON gatepass_requests
FOR EACH ROW EXECUTE FUNCTION set_parent_approval_token();

-- =====================================================
-- RLS (open for development; tighten for production)
-- =====================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatepass_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY students_all ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY parents_all ON parents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY wardens_all ON wardens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY requests_all ON gatepass_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY approvals_all ON approvals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY notifications_all ON notifications FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Views / Helper Functions
-- =====================================================

CREATE OR REPLACE VIEW v_warden_requests AS
SELECT
  r.id,
  r.student_name,
  r.roll_number,
  r.student_email,
  r.reason,
  r.destination,
  r.departure_date_time,
  r.return_date_time,
  r.status,
  r.parent_approved_at,
  r.parent_rejection_reason,
  r.warden_notes,
  r.created_at
FROM gatepass_requests r
WHERE r.status IN ('Pending Parent Approval','Approved by Parent');

CREATE OR REPLACE FUNCTION get_student_requests(p_student_id UUID)
RETURNS SETOF gatepass_requests AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM gatepass_requests
  WHERE student_id = p_student_id
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Seed (optional for testing)
-- =====================================================

INSERT INTO parents (full_name, email, phone) VALUES
  ('Mr. Sharma', 'parent1@gmail.com', '+91-9876543220'),
  ('Mrs. Patel', 'parent2@gmail.com', '+91-9876543221')
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (full_name, email, roll_number, phone) VALUES
  ('Rahul Sharma', 'student1@college.edu', '2021CS001', '+91-9876543210'),
  ('Priya Patel', 'student2@college.edu', '2021CS002', '+91-9876543211')
ON CONFLICT (roll_number) DO NOTHING;

INSERT INTO wardens (full_name, email, phone) VALUES
  ('Dr. Kumar', 'warden@college.edu', '+91-9876543230')
ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE s_id UUID; p_id UUID;
BEGIN
  SELECT id INTO s_id FROM students WHERE roll_number = '2021CS001';
  SELECT id INTO p_id FROM parents WHERE email = 'parent1@gmail.com';
  IF s_id IS NOT NULL THEN
    INSERT INTO gatepass_requests (
      student_id, parent_id, student_name, roll_number, student_email, parent_email,
      reason, destination, departure_date_time, return_date_time, status
    ) VALUES (
      s_id, p_id, 'Rahul Sharma', '2021CS001', 'student1@college.edu', 'parent1@gmail.com',
      'Family function', 'Home', NOW() + INTERVAL '1 day', NOW() + INTERVAL '3 days', 'Pending Parent Approval'
    );
  END IF;
END $$;

-- =====================================================
-- End of schema
-- =====================================================
