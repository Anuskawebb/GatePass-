"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { CreateGatepassRequest } from "@/lib/types"
import { revalidatePath } from "next/cache"

export async function createGatepassRequest(data: CreateGatepassRequest) {
  try {
    console.log("[v0] Creating gatepass request for:", data.student_name)
    const supabase = await getSupabaseServerClient()

    const { data: request, error } = await supabase
      .from("gatepass_requests")
      .insert([
        {
          student_id: data.student_id,
          parent_id: data.parent_id,
          student_name: data.student_name,
          roll_number: data.roll_number,
          student_email: data.student_email || `${data.roll_number}@college.edu`,
          parent_email: data.parent_email,
          reason: data.reason,
          destination: data.destination,
          departure_date_time: data.departure_date_time,
          return_date_time: data.return_date_time,
          status: "Pending Parent Approval",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating gatepass request:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Gatepass request created successfully:", request.id)

    const approvalLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/parent-approval/${request.id}`
    console.log("[v0] Parent approval link:", approvalLink)

    revalidatePath("/dashboard")
    return { success: true, data: request }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" }
  }
}

export async function getGatepassRequest(id: string) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.from("gatepass_requests").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] Error fetching gatepass request:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updateGatepassStatus(
  id: string,
  status: "Approved by Parent" | "Rejected by Parent",
  rejectionReason?: string,
) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: request } = await supabase.from("gatepass_requests").select("*").eq("id", id).single()

    if (!request) {
      return { success: false, error: "Request not found" }
    }

    const updateData: any = {
      status,
      parent_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (rejectionReason) {
      updateData.parent_rejection_reason = rejectionReason
    }

    const { data, error } = await supabase.from("gatepass_requests").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating gatepass status:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Status updated, warden can view on dashboard")

    revalidatePath("/dashboard")
    revalidatePath(`/parent-approval/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getAllGatepassRequests() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("gatepass_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching gatepass requests:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
