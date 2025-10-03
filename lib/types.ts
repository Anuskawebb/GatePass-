export interface GatepassRequest {
  id: string
  student_name: string
  roll_number: string
  student_email?: string
  destination: string
  purpose: string
  departure_datetime: string
  duration: string
  parent_email: string
  parent_approval_link?: string
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
  student_name: string
  roll_number: string
  student_email?: string
  destination: string
  purpose: string
  departure_datetime: string
  duration: string
  parent_email: string
}
