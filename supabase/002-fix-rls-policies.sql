-- =====================================================
-- Fix RLS Policies for Public Access
-- =====================================================
-- This fixes the "RLS Enabled No Policy" warnings by adding policies
-- that allow public access since we don't have authentication yet.

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Wardens can view all users" ON users;
DROP POLICY IF EXISTS "Students can view own requests" ON gatepass_requests;
DROP POLICY IF EXISTS "Students can create requests" ON gatepass_requests;
DROP POLICY IF EXISTS "Parents can view requests for their email" ON gatepass_requests;
DROP POLICY IF EXISTS "Parents can update their requests" ON gatepass_requests;
DROP POLICY IF EXISTS "Wardens can view all requests" ON gatepass_requests;
DROP POLICY IF EXISTS "Wardens can update all requests" ON gatepass_requests;

-- =====================================================
-- PUBLIC ACCESS POLICIES (No Authentication Required)
-- =====================================================

-- Allow public read access to users table
CREATE POLICY "Allow public read access to users"
  ON users FOR SELECT
  TO public
  USING (true);

-- Allow public insert access to users table
CREATE POLICY "Allow public insert access to users"
  ON users FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access to users table
CREATE POLICY "Allow public update access to users"
  ON users FOR UPDATE
  TO public
  USING (true);

-- Allow public read access to gatepass_requests table
CREATE POLICY "Allow public read access to gatepass_requests"
  ON gatepass_requests FOR SELECT
  TO public
  USING (true);

-- Allow public insert access to gatepass_requests table
CREATE POLICY "Allow public insert access to gatepass_requests"
  ON gatepass_requests FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access to gatepass_requests table
CREATE POLICY "Allow public update access to gatepass_requests"
  ON gatepass_requests FOR UPDATE
  TO public
  USING (true);

-- Allow public delete access to gatepass_requests table (for testing)
CREATE POLICY "Allow public delete access to gatepass_requests"
  ON gatepass_requests FOR DELETE
  TO public
  USING (true);

-- =====================================================
-- Fix Function Search Path Warnings
-- =====================================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix generate_parent_approval_link function
CREATE OR REPLACE FUNCTION generate_parent_approval_link()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.parent_approval_link = '/parent-approval/' || NEW.id::TEXT;
  RETURN NEW;
END;
$$;

-- Fix get_pending_requests_for_warden function
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
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix get_my_requests function
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
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- RLS policies updated for public access!
-- Function search path warnings fixed!
-- Your GateFlow app should now work without authentication.
