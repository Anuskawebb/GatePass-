// =====================================================
// Frontend Supabase Client Helper Functions
// =====================================================
// These functions provide a clean interface for interacting with Supabase
// from your Next.js frontend. Import these into your pages/components.
//
// IMPORTANT: These are commented out to prevent breaking your current frontend.
// Uncomment and integrate them when you're ready to connect to Supabase.

import { createBrowserClient } from "@supabase/ssr"

// Initialize Supabase client (browser-side)
const getSupabaseClient = () => {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// =====================================================
// STUDENT FUNCTIONS
// =====================================================

/**
 * Insert a new gatepass request (Student Form Submission)
 *
 * Usage in your student form page:
 *
 * const result = await insertRequest({
 *   student_name: "Rahul Sharma",
 *   roll_number: "2021CS001",
 *   student_email: "rahul@college.edu",
 *   destination: "Home",
 *   purpose: "Family function",
 *   departure_datetime: "2025-02-15T10:00:00",
 *   duration: "2 days",
 *   parent_email: "parent@gmail.com"
 * })
 */
export async function insertRequest(requestData: {
  student_name: string
  roll_number: string
  student_email: string
  destination: string
  purpose: string
  departure_datetime: string
  duration: string
  parent_email: string
}) {
  const supabase = getSupabaseClient()

  try {
    // Get current user ID (if using Supabase Auth)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("gatepass_requests")
      .insert([
        {
          student_id: user?.id, // Optional: link to authenticated user
          student_name: requestData.student_name,
          roll_number: requestData.roll_number,
          student_email: requestData.student_email,
          destination: requestData.destination,
          purpose: requestData.purpose,
          departure_datetime: requestData.departure_datetime,
          duration: requestData.duration,
          parent_email: requestData.parent_email,
          status: "Pending Parent Approval",
        },
      ])
      .select()
      .single()

    if (error) throw error

    console.log("[insertRequest] Request created successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("[insertRequest] Error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all requests for the current student
 *
 * Usage in student dashboard:
 *
 * const { data, error } = await getMyRequests()
 * if (data) {
 *   // Display student's own requests
 * }
 */
export async function getMyRequests() {
  const supabase = getSupabaseClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("gatepass_requests")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    console.log("[getMyRequests] Fetched requests:", data?.length)
    return { success: true, data }
  } catch (error) {
    console.error("[getMyRequests] Error:", error)
    return { success: false, error: error.message, data: [] }
  }
}

// =====================================================
// PARENT FUNCTIONS
// =====================================================

/**
 * Get a specific gatepass request by ID (Parent Approval Page)
 *
 * Usage in parent approval page:
 *
 * const { data } = await getRequestById(requestId)
 * if (data) {
 *   // Display request details for parent to review
 * }
 */
export async function getRequestById(requestId: string) {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.from("gatepass_requests").select("*").eq("id", requestId).single()

    if (error) throw error

    console.log("[getRequestById] Fetched request:", data?.id)
    return { success: true, data }
  } catch (error) {
    console.error("[getRequestById] Error:", error)
    return { success: false, error: error.message, data: null }
  }
}

/**
 * Update gatepass request status (Parent Approval/Rejection)
 *
 * Usage in parent approval page:
 *
 * // For approval:
 * await updateRequestStatus(requestId, 'Approved by Parent')
 *
 * // For rejection:
 * await updateRequestStatus(requestId, 'Rejected by Parent', 'Not available on that date')
 */
export async function updateRequestStatus(
  requestId: string,
  status: "Approved by Parent" | "Rejected by Parent",
  rejectionReason?: string,
) {
  const supabase = getSupabaseClient()

  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "Approved by Parent") {
      updateData.parent_approved_at = new Date().toISOString()
    } else if (status === "Rejected by Parent" && rejectionReason) {
      updateData.parent_rejection_reason = rejectionReason
    }

    const { data, error } = await supabase
      .from("gatepass_requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single()

    if (error) throw error

    console.log("[updateRequestStatus] Status updated:", status)
    return { success: true, data }
  } catch (error) {
    console.error("[updateRequestStatus] Error:", error)
    return { success: false, error: error.message }
  }
}

// =====================================================
// WARDEN FUNCTIONS
// =====================================================

/**
 * Get all gatepass requests for warden dashboard
 *
 * Usage in warden dashboard:
 *
 * const { data } = await getRequestsForWarden()
 * if (data) {
 *   // Display all requests in dashboard table
 * }
 *
 * Optional: Filter by status
 * const { data } = await getRequestsForWarden('Approved by Parent')
 */
export async function getRequestsForWarden(statusFilter?: string) {
  const supabase = getSupabaseClient()

  try {
    let query = supabase.from("gatepass_requests").select("*").order("created_at", { ascending: false })

    // Apply status filter if provided
    if (statusFilter) {
      query = query.eq("status", statusFilter)
    }

    const { data, error } = await query

    if (error) throw error

    console.log("[getRequestsForWarden] Fetched requests:", data?.length)
    return { success: true, data }
  } catch (error) {
    console.error("[getRequestsForWarden] Error:", error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Update gatepass request with warden approval/denial
 *
 * Usage in warden dashboard:
 *
 * // For approval:
 * await wardenUpdateRequest(requestId, 'Warden Approved', 'Approved for travel')
 *
 * // For denial:
 * await wardenUpdateRequest(requestId, 'Warden Denied', 'Insufficient reason provided')
 */
export async function wardenUpdateRequest(
  requestId: string,
  status: "Warden Approved" | "Warden Denied",
  notes?: string,
) {
  const supabase = getSupabaseClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const updateData: any = {
      status,
      warden_notes: notes,
      warden_approved_by: user.id,
      updated_at: new Date().toISOString(),
    }

    if (status === "Warden Approved") {
      updateData.warden_approved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("gatepass_requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single()

    if (error) throw error

    console.log("[wardenUpdateRequest] Warden decision recorded:", status)
    return { success: true, data }
  } catch (error) {
    console.error("[wardenUpdateRequest] Error:", error)
    return { success: false, error: error.message }
  }
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS (Optional)
// =====================================================

/**
 * Subscribe to real-time updates for gatepass requests
 *
 * Usage in warden dashboard for live updates:
 *
 * const unsubscribe = subscribeToRequests((payload) => {
 *   console.log('New update:', payload)
 *   // Refresh your dashboard data
 * })
 *
 * // Clean up when component unmounts
 * return () => unsubscribe()
 */
export function subscribeToRequests(callback: (payload: any) => void, statusFilter?: string) {
  const supabase = getSupabaseClient()

  const subscription = supabase
    .channel("gatepass_requests_changes")
    .on(
      "postgres_changes",
      {
        event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
        schema: "public",
        table: "gatepass_requests",
        filter: statusFilter ? `status=eq.${statusFilter}` : undefined,
      },
      callback,
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Format status for display with color coding
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    "Pending Parent Approval": "text-yellow-600 bg-yellow-50",
    "Approved by Parent": "text-blue-600 bg-blue-50",
    "Rejected by Parent": "text-red-600 bg-red-50",
    "Warden Approved": "text-green-600 bg-green-50",
    "Warden Denied": "text-red-600 bg-red-50",
    Completed: "text-gray-600 bg-gray-50",
  }

  return statusColors[status] || "text-gray-600 bg-gray-50"
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  })
}
