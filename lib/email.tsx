"use server"

import nodemailer from "nodemailer"

// Create reusable transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_SERVER,
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendParentApprovalEmail(
  parentEmail: string,
  studentName: string,
  approvalLink: string,
  destination: string,
  purpose: string,
  departureDateTime: string,
) {
  try {
    console.log("[v0] Sending parent approval email to:", parentEmail)

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: parentEmail,
      subject: `Gatepass Approval Request from ${studentName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; width: 150px; color: #6b7280; }
            .detail-value { flex: 1; color: #111827; }
            .button { display: inline-block; padding: 12px 30px; margin: 10px 5px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center; }
            .approve-btn { background: #10b981; color: white; }
            .reject-btn { background: #ef4444; color: white; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 GateFlow - Gatepass Approval Request</h1>
            </div>
            <div class="content">
              <p>Dear Parent/Guardian,</p>
              <p>Your ward <strong>${studentName}</strong> has submitted a gatepass request that requires your approval.</p>
              
              <div class="details">
                <h3 style="margin-top: 0; color: #0ea5e9;">Request Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Student Name:</span>
                  <span class="detail-value">${studentName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Destination:</span>
                  <span class="detail-value">${destination}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Purpose:</span>
                  <span class="detail-value">${purpose}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Departure Time:</span>
                  <span class="detail-value">${new Date(departureDateTime).toLocaleString()}</span>
                </div>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${approvalLink}" class="button approve-btn">Review & Approve/Reject</a>
              </p>

              <p style="font-size: 14px; color: #6b7280;">
                Click the button above to review the complete request and provide your approval or rejection.
              </p>

              <div class="footer">
                <p>This is an automated email from GateFlow Digital Gatepass Management System.</p>
                <p>If you did not expect this email, please contact the college administration.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("[v0] Parent approval email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[v0] Error sending parent approval email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to send email" }
  }
}

export async function sendWardenNotificationEmail(
  studentName: string,
  rollNumber: string,
  destination: string,
  purpose: string,
  departureDateTime: string,
  parentStatus: "Approved by Parent" | "Rejected by Parent",
) {
  try {
    console.log("[v0] Sending warden notification email")

    const wardenEmail = process.env.WARDEN_EMAIL || "warden@college.edu"
    const statusColor = parentStatus === "Approved by Parent" ? "#10b981" : "#ef4444"
    const statusIcon = parentStatus === "Approved by Parent" ? "✅" : "❌"

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: wardenEmail,
      subject: `Gatepass ${parentStatus} - ${studentName} (${rollNumber})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; width: 150px; color: #6b7280; }
            .detail-value { flex: 1; color: #111827; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 GateFlow - Warden Notification</h1>
            </div>
            <div class="content">
              <p>Dear Warden,</p>
              <p>A gatepass request has been processed by the parent.</p>
              
              <div style="text-align: center;">
                <span class="status-badge" style="background: ${statusColor}; color: white;">
                  ${statusIcon} ${parentStatus}
                </span>
              </div>

              <div class="details">
                <h3 style="margin-top: 0; color: #0ea5e9;">Request Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Student Name:</span>
                  <span class="detail-value">${studentName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Roll Number:</span>
                  <span class="detail-value">${rollNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Destination:</span>
                  <span class="detail-value">${destination}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Purpose:</span>
                  <span class="detail-value">${purpose}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Departure Time:</span>
                  <span class="detail-value">${new Date(departureDateTime).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Parent Status:</span>
                  <span class="detail-value" style="color: ${statusColor}; font-weight: bold;">${parentStatus}</span>
                </div>
              </div>

              <p>Please review this request in the GateFlow dashboard for final approval.</p>

              <div class="footer">
                <p>This is an automated notification from GateFlow Digital Gatepass Management System.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("[v0] Warden notification email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[v0] Error sending warden notification email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to send email" }
  }
}
