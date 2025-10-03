-- =====================================================
-- GateFlow Database Schema for Supabase
-- =====================================================
-- This file contains the complete database schema for the GateFlow gatepass management system.
-- Copy and paste this entire file into the Supabase SQL Editor to set up your database.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
-- Stores user information with role-based access (student, parent, warden)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'warden', 'security')),
  phone TEXT,
  roll_number TEXT UNIQUE, -- Only for students
  parent_email TEXT, -- Links student to parent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure missing columns exist when rerunning schema
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS roll_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);

-- =====================================================
-- GATEPASS REQUESTS TABLE
-- =====================================================
-- Stores all gatepass requests with approval workflow
CREATE TABLE IF NOT EXISTS gatepass_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Student Information
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  student_email TEXT NOT NULL,
  
  -- Request Details
  destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  departure_datetime TIMESTAMPTZ NOT NULL,
  duration TEXT NOT NULL,
  
  -- Parent Information
  parent_email TEXT NOT NULL,
  parent_approval_link TEXT, -- Unique link for parent approval
  
  -- Status and Approval Workflow
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
  
  -- Approval Details
  parent_approved_at TIMESTAMPTZ,
  parent_rejection_reason TEXT,
  warden_approved_at TIMESTAMPTZ,
  warden_approved_by UUID REFERENCES users(id),
  warden_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure missing columns exist when rerunning schema
ALTER TABLE gatepass_requests
  ADD COLUMN IF NOT EXISTS student_id UUID,
  ADD COLUMN IF NOT EXISTS student_name TEXT,
  ADD COLUMN IF NOT EXISTS roll_number TEXT,
  ADD COLUMN IF NOT EXISTS student_email TEXT,
  ADD COLUMN IF NOT EXISTS destination TEXT,
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  ADD COLUMN IF NOT EXISTS departure_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS parent_approval_link TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS parent_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parent_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS warden_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS warden_approved_by UUID,
  ADD COLUMN IF NOT EXISTS warden_notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure foreign key exists for student_id → users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gatepass_requests_student_id_fkey'
  ) THEN
    ALTER TABLE gatepass_requests
      ADD CONSTRAINT gatepass_requests_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_gatepass_student_id ON gatepass_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_gatepass_status ON gatepass_requests(status);
CREATE INDEX IF NOT EXISTS idx_gatepass_parent_email ON gatepass_requests(parent_email);
CREATE INDEX IF NOT EXISTS idx_gatepass_created_at ON gatepass_requests(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically update 'updated_at' timestamp on users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update 'updated_at' timestamp on gatepass_requests table
CREATE TRIGGER update_gatepass_requests_updated_at
  BEFORE UPDATE ON gatepass_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to generate unique parent approval link on INSERT
CREATE OR REPLACE FUNCTION generate_parent_approval_link()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a unique approval link using the request ID
  NEW.parent_approval_link = '/parent-approval/' || NEW.id::TEXT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_parent_approval_link
  BEFORE INSERT ON gatepass_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_parent_approval_link();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatepass_requests ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Allow users to read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Allow wardens and security to view all users
CREATE POLICY "Wardens can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('warden', 'security')
    )
  );

-- Gatepass requests policies
-- Students can view their own requests
CREATE POLICY "Students can view own requests"
  ON gatepass_requests FOR SELECT
  USING (student_id = auth.uid());

-- Students can insert their own requests
CREATE POLICY "Students can create requests"
  ON gatepass_requests FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Parents can view requests sent to their email
CREATE POLICY "Parents can view requests for their email"
  ON gatepass_requests FOR SELECT
  USING (parent_email = (SELECT email FROM users WHERE id = auth.uid()));

-- Parents can update requests sent to their email (for approval/rejection)
CREATE POLICY "Parents can update their requests"
  ON gatepass_requests FOR UPDATE
  USING (parent_email = (SELECT email FROM users WHERE id = auth.uid()));

-- Wardens and security can view all requests
CREATE POLICY "Wardens can view all requests"
  ON gatepass_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('warden', 'security')
    )
  );

-- Wardens can update all requests (for final approval)
CREATE POLICY "Wardens can update all requests"
  ON gatepass_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('warden', 'security')
    )
  );

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample users
INSERT INTO users (email, full_name, role, roll_number, parent_email, phone) VALUES
  ('student1@college.edu', 'Rahul Sharma', 'student', '2021CS001', 'parent1@gmail.com', '+91-9876543210'),
  ('student2@college.edu', 'Priya Patel', 'student', '2021CS002', 'parent2@gmail.com', '+91-9876543211'),
  ('parent1@gmail.com', 'Mr. Sharma', 'parent', NULL, NULL, '+91-9876543220'),
  ('parent2@gmail.com', 'Mrs. Patel', 'parent', NULL, NULL, '+91-9876543221'),
  ('warden@college.edu', 'Dr. Kumar', 'warden', NULL, NULL, '+91-9876543230'),
  ('security@college.edu', 'Security Officer', 'security', NULL, NULL, '+91-9876543240')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- FUNCTIONS FOR COMMON QUERIES
-- =====================================================

-- Function to get all pending requests for warden dashboard
CREATE OR REPLACE FUNCTION get_pending_requests_for_warden()
RETURNS TABLE (
  id UUID,
  student_name TEXT,
  roll_number TEXT,
  destination TEXT,
  purpose TEXT,
  departure_datetime TIMESTAMPTZ,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gr.id,
    gr.student_name,
    gr.roll_number,
    gr.destination,
    gr.purpose,
    gr.departure_datetime,
    gr.status,
    gr.created_at
  FROM gatepass_requests gr
  WHERE gr.status IN ('Approved by Parent', 'Pending Parent Approval')
  ORDER BY gr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student's own requests
CREATE OR REPLACE FUNCTION get_my_requests(student_user_id UUID)
RETURNS TABLE (
  id UUID,
  destination TEXT,
  purpose TEXT,
  departure_datetime TIMESTAMPTZ,
  duration TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  parent_approved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gr.id,
    gr.destination,
    gr.purpose,
    gr.departure_datetime,
    gr.duration,
    gr.status,
    gr.created_at,
    gr.parent_approved_at
  FROM gatepass_requests gr
  WHERE gr.student_id = student_user_id
  ORDER BY gr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Schema setup complete! 
-- Next steps:
-- 1. Deploy the Edge Functions (notifyParent and notifyWarden)
-- 2. Configure email service in Supabase settings
-- 3. Update your frontend environment variables with Supabase URL and keys
