export interface GatepassRequest {
  id: string
  student_name: string
  roll_number: string
  student_email?: string | null
  parent_email?: string | null
  reason: string
  destination?: string | null
  departure_date_time: string
  return_date_time?: string | null
  // Compatibility fields (present in DB for old UI)
  purpose?: string | null
  departure_datetime?: string | null
  duration?: string | null
  status:
    | "Pending Parent Approval"
    | "Approved by Parent"
    | "Rejected by Parent"
    | "Warden Approved"
    | "Warden Denied"
    | "Completed"
  parent_approved_at?: string | null
  parent_rejection_reason?: string | null
  warden_approved_at?: string | null
  warden_notes?: string | null
  created_at: string
  updated_at: string
}

export interface CreateGatepassRequest {
  student_id?: string // if available from auth-to-student mapping
  parent_id?: string
  student_name: string
  roll_number: string
  student_email?: string
  parent_email: string
  reason: string
  destination?: string
  departure_date_time: string
  return_date_time?: string
}
