// =====================================================
// Supabase Edge Function: notifyWarden
// =====================================================
// This function is triggered when a gatepass request status changes to
// "Approved by Parent" or "Rejected by Parent".
// It sends an email notification to the warden.
//
// Deploy this function using:
// supabase functions deploy notifyWarden
//
// Set up the database trigger:
// CREATE TRIGGER on_gatepass_status_changed
//   AFTER UPDATE ON gatepass_requests
//   FOR EACH ROW
//   WHEN (OLD.status IS DISTINCT FROM NEW.status)
//   EXECUTE FUNCTION supabase_functions.http_request(
//     'https://your-project.supabase.co/functions/v1/notifyWarden',
//     'POST',
//     '{"Content-Type":"application/json"}',
//     '{}',
//     '1000'
//   );

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { env } from "https://deno.land/std@0.168.0/dotenv/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface GatepassRequest {
  id: string
  student_name: string
  roll_number: string
  student_email: string
  destination: string
  purpose: string
  departure_datetime: string
  duration: string
  parent_email: string
  status: string
  parent_approved_at?: string
  parent_rejection_reason?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const envData = await env()
    const supabaseClient = createClient(envData.SUPABASE_URL ?? "", envData.SUPABASE_SERVICE_ROLE_KEY ?? "")

    // Get the request data from the webhook payload
    const { record, old_record } = (await req.json()) as {
      record: GatepassRequest
      old_record: GatepassRequest
    }

    console.log("[notifyWarden] Processing status change:", old_record.status, "->", record.status)

    // Only notify warden if status changed to "Approved by Parent" or "Rejected by Parent"
    if (!["Approved by Parent", "Rejected by Parent"].includes(record.status)) {
      console.log("[notifyWarden] Status not relevant for warden notification")
      return new Response(JSON.stringify({ success: true, message: "No notification needed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get warden email(s) from users table
    const { data: wardens, error: wardenError } = await supabaseClient
      .from("users")
      .select("email, full_name")
      .eq("role", "warden")

    if (wardenError || !wardens || wardens.length === 0) {
      throw new Error("No warden found in the system")
    }

    // Format the departure date/time
    const departureDate = new Date(record.departure_datetime).toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    })

    // Construct dashboard link
    const appUrl = envData.APP_URL || "http://localhost:3000"
    const dashboardLink = `${appUrl}/dashboard`

    // Determine email content based on status
    const isApproved = record.status === "Approved by Parent"
    const statusColor = isApproved ? "#10b981" : "#ef4444"
    const statusText = isApproved ? "APPROVED" : "REJECTED"

    // Email content
    const emailSubject = `Gatepass ${statusText} by Parent - ${record.student_name}`
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Gatepass Status Update</h2>
        
        <p>Dear Warden,</p>
        
        <p>A gatepass request has been <strong style="color: ${statusColor};">${statusText}</strong> by the parent.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Student Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Name:</strong></td>
              <td style="padding: 8px 0;">${record.student_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Roll Number:</strong></td>
              <td style="padding: 8px 0;">${record.roll_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
              <td style="padding: 8px 0;">${record.student_email}</td>
            </tr>
          </table>
        </div>
        
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
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Parent Status:</strong></td>
              <td style="padding: 8px 0; color: ${statusColor}; font-weight: bold;">${statusText}</td>
            </tr>
            ${
              record.parent_rejection_reason
                ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Rejection Reason:</strong></td>
              <td style="padding: 8px 0;">${record.parent_rejection_reason}</td>
            </tr>
            `
                : ""
            }
          </table>
        </div>
        
        ${
          isApproved
            ? `
        <p>This request is now pending your final approval. Please review it in the warden dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Go to Warden Dashboard
          </a>
        </div>
        `
            : `
        <p>This request has been rejected by the parent and does not require further action.</p>
        `
        }
        
        <p style="color: #6b7280; font-size: 14px;">
          Dashboard link:<br>
          <a href="${dashboardLink}" style="color: #2563eb;">${dashboardLink}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated email from GateFlow - Digital Gatepass Management System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `

    // Send email to all wardens
    const RESEND_API_KEY = envData.RESEND_API_KEY

    if (RESEND_API_KEY) {
      for (const warden of wardens) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "GateFlow <noreply@yourdomain.com>",
            to: [warden.email],
            subject: emailSubject,
            html: emailBody,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          console.error(`[notifyWarden] Failed to send email to ${warden.email}:`, data)
        } else {
          console.log(`[notifyWarden] Email sent successfully to ${warden.email}`)
        }
      }
    } else {
      // Log email content (for development/testing)
      console.log("[notifyWarden] Email would be sent to:", wardens.map((w) => w.email).join(", "))
      console.log("[notifyWarden] Dashboard link:", dashboardLink)
      console.log("[notifyWarden] RESEND_API_KEY not configured - email not sent")
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Warden notification sent",
        requestId: record.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("[notifyWarden] Error:", error)
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
