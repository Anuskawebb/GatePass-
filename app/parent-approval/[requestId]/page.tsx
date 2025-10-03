"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, MapPin, User, FileText, Mail, CheckCircle, XCircle, Hash } from "lucide-react"
import { getGatepassRequest, updateGatepassStatus } from "@/app/actions/gatepass"
import type { GatepassRequest } from "@/lib/types"

export default function ParentApprovalPage() {
  const params = useParams()
  const requestId = params.requestId as string
  const { toast } = useToast()

  const [request, setRequest] = useState<GatepassRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true)
      setError(null)

      const result = await getGatepassRequest(requestId)

      if (result.success && result.data) {
        setRequest(result.data)
      } else {
        setError(result.error || "Failed to load request")
      }

      setLoading(false)
    }

    fetchRequest()
  }, [requestId])

  const handleApprove = async () => {
    setProcessing(true)

    const result = await updateGatepassStatus(requestId, "Approved by Parent")

    if (result.success && result.data) {
      setRequest(result.data)
      toast({
        title: "Request Approved",
        description: "The gatepass request has been approved. Warden has been notified.",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to approve request",
        variant: "destructive",
      })
    }

    setProcessing(false)
  }

  const handleReject = async () => {
    setProcessing(true)

    const result = await updateGatepassStatus(requestId, "Rejected by Parent")

    if (result.success && result.data) {
      setRequest(result.data)
      toast({
        title: "Request Rejected",
        description: "The gatepass request has been rejected. Warden has been notified.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reject request",
        variant: "destructive",
      })
    }

    setProcessing(false)
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading request details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <XCircle className="h-16 w-16 text-destructive" />
                <h2 className="text-2xl font-bold">Request Not Found</h2>
                <p className="text-muted-foreground text-center">
                  {error || "The gatepass request you're looking for doesn't exist or the link is invalid."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isPending = request.status === "Pending Parent Approval"
  const isApproved = request.status === "Approved by Parent" || request.status === "Warden Approved"
  const isRejected = request.status === "Rejected by Parent" || request.status === "Warden Denied"

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-balance mb-3">Parent Approval</h1>
          <p className="text-lg text-muted-foreground text-pretty">Review and approve your child's gatepass request</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Gatepass Request</CardTitle>
                <CardDescription>Request ID: {request.id}</CardDescription>
              </div>
              <Badge variant={isApproved ? "default" : isRejected ? "destructive" : "secondary"} className="text-sm">
                {request.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Student Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Student Name</p>
                    <p className="font-medium">{request.student_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Roll Number</p>
                    <p className="font-medium">{request.roll_number}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Request Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Request Details</h3>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-medium">{request.destination}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="font-medium">{request.purpose}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{formatDateTime(request.departure_datetime)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{request.duration}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Parent Email</p>
                  <p className="font-medium">{request.parent_email}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Submitted on {formatDateTime(request.created_at)}</p>
              {request.parent_approved_at && (
                <p className="text-sm text-muted-foreground">
                  Processed on {formatDateTime(request.parent_approved_at)}
                </p>
              )}
            </div>

            {/* Action Buttons or Status Message */}
            {isPending ? (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={handleApprove} disabled={processing} className="flex-1" size="lg">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {processing ? "Processing..." : "Approve Request"}
                </Button>
                <Button onClick={handleReject} disabled={processing} variant="destructive" className="flex-1" size="lg">
                  <XCircle className="h-5 w-5 mr-2" />
                  {processing ? "Processing..." : "Reject Request"}
                </Button>
              </div>
            ) : (
              <div className="pt-4">
                <Card
                  className={
                    isApproved
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : "border-red-500 bg-red-50 dark:bg-red-950"
                  }
                >
                  <CardContent className="py-6">
                    <div className="flex items-center gap-3">
                      {isApproved ? (
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      )}
                      <div>
                        <p className="font-semibold text-lg">{isApproved ? "Request Approved" : "Request Rejected"}</p>
                        <p className="text-sm text-muted-foreground">
                          This request has already been processed and cannot be modified.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            If you have any questions or concerns, please contact the college administration.
          </p>
        </div>
      </div>
    </div>
  )
}
