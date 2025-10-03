# GateFlow Supabase Backend Setup

This directory contains all the backend code and database schema for the GateFlow gatepass management system.

## 📁 Directory Structure

\`\`\`
supabase/
├── schema.sql                    # Complete database schema
├── functions/
│   ├── notifyParent/
│   │   └── index.ts             # Edge function for parent notifications
│   └── notifyWarden/
│       └── index.ts             # Edge function for warden notifications
├── client/
│   └── requests.ts              # Frontend helper functions
└── README.md                    # This file
\`\`\`

## 🚀 Setup Instructions

### 1. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `schema.sql`
4. Paste and run it in the SQL Editor
5. Verify that tables are created: `users` and `gatepass_requests`

### 2. Edge Functions Setup

#### Install Supabase CLI

\`\`\`bash
npm install -g supabase
\`\`\`

#### Login to Supabase

\`\`\`bash
supabase login
\`\`\`

#### Link your project

\`\`\`bash
supabase link --project-ref your-project-ref
\`\`\`

#### Deploy Edge Functions

\`\`\`bash
# Deploy notifyParent function
supabase functions deploy notifyParent

# Deploy notifyWarden function
supabase functions deploy notifyWarden
\`\`\`

#### Set Environment Variables for Edge Functions

\`\`\`bash
# Set your app URL
supabase secrets set APP_URL=https://your-app-url.vercel.app

# Set Resend API key (for email sending)
supabase secrets set RESEND_API_KEY=re_your_api_key_here
\`\`\`

### 3. Database Triggers Setup

After deploying the Edge Functions, set up database triggers to automatically call them:

\`\`\`sql
-- Trigger to notify parent when new request is created
CREATE OR REPLACE FUNCTION notify_parent_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/notifyParent',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_gatepass_request_created
  AFTER INSERT ON gatepass_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_parent_on_insert();

-- Trigger to notify warden when status changes
CREATE OR REPLACE FUNCTION notify_warden_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/notifyWarden',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := json_build_object('record', row_to_json(NEW), 'old_record', row_to_json(OLD))::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_gatepass_status_changed
  AFTER UPDATE ON gatepass_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_warden_on_status_change();
\`\`\`

### 4. Email Service Setup (Resend)

1. Sign up for [Resend](https://resend.com)
2. Get your API key
3. Add it to Supabase secrets (see step 2 above)
4. Verify your domain in Resend dashboard
5. Update the `from` email in Edge Functions to use your verified domain

### 5. Frontend Integration

1. Install Supabase client in your Next.js app:

\`\`\`bash
npm install @supabase/supabase-js @supabase/ssr
\`\`\`

2. Add environment variables to your `.env.local`:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

3. Import and use the helper functions from `supabase/client/requests.ts` in your pages

## 📊 Database Schema Overview

### Users Table
- Stores students, parents, wardens, and security staff
- Role-based access control
- Links students to their parents via email

### Gatepass Requests Table
- Stores all gatepass requests
- Tracks approval workflow (Parent → Warden)
- Includes unique approval links for parents
- Maintains audit trail with timestamps

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- Students can only view/create their own requests
- Parents can only view/update requests sent to their email
- Wardens can view/update all requests
- Secure Edge Functions with service role authentication

## 🧪 Testing

### Test the Database

\`\`\`sql
-- Insert a test request
INSERT INTO gatepass_requests (
  student_name, roll_number, student_email,
  destination, purpose, departure_datetime, duration, parent_email
) VALUES (
  'Test Student', '2021CS999', 'test@college.edu',
  'Home', 'Testing', NOW() + INTERVAL '1 day', '2 days', 'parent@test.com'
);

-- Check if it was created
SELECT * FROM gatepass_requests ORDER BY created_at DESC LIMIT 1;
\`\`\`

### Test Edge Functions

\`\`\`bash
# Test notifyParent function
supabase functions invoke notifyParent --data '{"record":{"id":"test-id","student_name":"Test Student","roll_number":"2021CS999","destination":"Home","purpose":"Testing","departure_datetime":"2025-02-15T10:00:00","duration":"2 days","parent_email":"parent@test.com","parent_approval_link":"/parent-approval/test-id"}}'

# Test notifyWarden function
supabase functions invoke notifyWarden --data '{"record":{"id":"test-id","student_name":"Test Student","roll_number":"2021CS999","student_email":"test@college.edu","destination":"Home","purpose":"Testing","departure_datetime":"2025-02-15T10:00:00","duration":"2 days","parent_email":"parent@test.com","status":"Approved by Parent"},"old_record":{"status":"Pending Parent Approval"}}'
\`\`\`

## 📝 Notes

- The Edge Functions use Resend for email sending. You can replace this with any email service (SendGrid, AWS SES, etc.)
- For development, emails are logged to console if `RESEND_API_KEY` is not set
- The parent approval link is automatically generated using a database trigger
- All timestamps use `TIMESTAMPTZ` for proper timezone handling

## 🆘 Troubleshooting

**Edge Functions not triggering?**
- Check that database triggers are created correctly
- Verify Edge Function URLs in trigger definitions
- Check Supabase logs: Dashboard → Edge Functions → Logs

**Emails not sending?**
- Verify `RESEND_API_KEY` is set correctly
- Check that your domain is verified in Resend
- Review Edge Function logs for errors

**RLS policies blocking access?**
- Temporarily disable RLS for testing: `ALTER TABLE gatepass_requests DISABLE ROW LEVEL SECURITY;`
- Check that user roles are set correctly in the `users` table
- Verify authentication is working properly

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend Documentation](https://resend.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
