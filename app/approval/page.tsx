"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Calendar, Clock, MapPin, FileText, User } from "lucide-react"
import { Suspense } from "react"

function ApprovalContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status") || "approved"
  const studentName = searchParams.get("student") || "John Doe"
  const destination = searchParams.get("destination") || "City Hospital"
  const purpose = searchParams.get("purpose") || "Medical appointment"
  const dateTime = searchParams.get("datetime") || "2025-02-15 10:00 AM"
  const duration = searchParams.get("duration") || "3 hours"

  const isApproved = status === "approved"

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {isApproved ? (
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle2 className="h-12 w-12 text-success" />
                </div>
              ) : (
                <div className="rounded-full bg-destructive/10 p-3">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">{isApproved ? "Request Approved" : "Request Rejected"}</CardTitle>
            <CardDescription className="text-base">
              You have {isApproved ? "approved" : "rejected"} {studentName}'s gatepass request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Request Details</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Student Name</p>
                    <p className="text-base font-semibold">{studentName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Destination</p>
                    <p className="text-base font-semibold">{destination}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                    <p className="text-base">{purpose}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                    <p className="text-base font-semibold">{dateTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <p className="text-base font-semibold">{duration}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Badge variant={isApproved ? "default" : "destructive"} className="text-base px-4 py-2">
                {isApproved ? "✓ Approved" : "✗ Rejected"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ApprovalPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading...</div>}>
      <ApprovalContent />
    </Suspense>
  )
}
