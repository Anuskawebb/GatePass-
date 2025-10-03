// =====================================================
// Supabase Edge Function: notifyParent
// =====================================================
// This function is triggered when a new gatepass request is created.
// It sends an email to the parent with an approval link.
//
// Deploy this function using:
// supabase functions deploy notifyParent
//
// Set up the database trigger:
// CREATE TRIGGER on_gatepass_request_created
//   AFTER INSERT ON gatepass_requests
//   FOR EACH ROW
//   EXECUTE FUNCTION supabase_functions.http_request(
//     'https://your-project.supabase.co/functions/v1/notifyParent',
//     'POST',
//     '{"Content-Type":"application/json"}',
//     '{}',
//     '1000'
//   );

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/node/global.ts" // Declare Deno variable

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface GatepassRequest {
  id: string
  student_name: string
  roll_number: string
  destination: string
  purpose: string
  departure_datetime: string
  duration: string
  parent_email: string
  parent_approval_link: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    // Get the request data from the webhook payload
    const { record } = (await req.json()) as { record: GatepassRequest }

    console.log("[notifyParent] Processing request:", record.id)

    // Construct the approval link
    const appUrl = Deno.env.get("APP_URL") || "http://localhost:3000"
    const approvalLink = `${appUrl}${record.parent_approval_link}`

    // Format the departure date/time
    const departureDate = new Date(record.departure_datetime).toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    })

    // Email content
    const emailSubject = `Gatepass Approval Required for ${record.student_name}`
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Gatepass Approval Request</h2>
        
        <p>Dear Parent,</p>
        
        <p>Your ward <strong>${record.student_name}</strong> (Roll No: ${record.roll_number}) has submitted a gatepass request that requires your approval.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Request Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Destination:</strong></td>
              <td style="padding: 8px 0;">${record.destination}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Purpose:</strong></td>
              <td style="padding: 8px 0;">${record.purpose}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Departure:</strong></td>
              <td style="padding: 8px 0;">${departureDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Duration:</strong></td>
              <td style="padding: 8px 0;">${record.duration}</td>
            </tr>
          </table>
        </div>
        
        <p>Please review and approve or reject this request by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Review Gatepass Request
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          <a href="${approvalLink}" style="color: #2563eb;">${approvalLink}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated email from GateFlow - Digital Gatepass Management System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `

    // Send email using Resend (recommended) or Supabase's built-in email
    // Option 1: Using Resend (recommended for production)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "GateFlow <noreply@yourdomain.com>",
          to: [record.parent_email],
          subject: emailSubject,
          html: emailBody,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(`Failed to send email: ${JSON.stringify(data)}`)
      }

      console.log("[notifyParent] Email sent successfully:", data)
    } else {
      // Option 2: Log email content (for development/testing)
      console.log("[notifyParent] Email would be sent to:", record.parent_email)
      console.log("[notifyParent] Approval link:", approvalLink)
      console.log("[notifyParent] RESEND_API_KEY not configured - email not sent")
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Parent notification sent",
        requestId: record.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("[notifyParent] Error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    )
  }
})
