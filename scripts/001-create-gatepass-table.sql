-- Create gatepass_requests table
CREATE TABLE IF NOT EXISTS gatepass_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  duration TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  parent_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gatepass_status ON gatepass_requests(status);
CREATE INDEX IF NOT EXISTS idx_gatepass_created_at ON gatepass_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE gatepass_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on gatepass_requests" ON gatepass_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);
