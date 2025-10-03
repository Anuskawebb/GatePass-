"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, MapPin, User, Mail, FileText, Hash } from "lucide-react"
import { createGatepassRequest } from "@/app/actions/gatepass"

export default function HomePage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    studentName: "",
    rollNumber: "",
    destination: "",
    purpose: "",
    dateTime: "",
    duration: "",
    parentEmail: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (
      !formData.studentName ||
      !formData.rollNumber ||
      !formData.destination ||
      !formData.purpose ||
      !formData.dateTime ||
      !formData.duration ||
      !formData.parentEmail
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const result = await createGatepassRequest({
      student_name: formData.studentName,
      roll_number: formData.rollNumber,
      destination: formData.destination,
      purpose: formData.purpose,
      departure_datetime: formData.dateTime,
      duration: formData.duration,
      parent_email: formData.parentEmail,
    })

    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: "Success!",
        description: "Your gatepass request has been submitted. Parent approval email sent.",
      })

      // Reset form
      setFormData({
        studentName: "",
        rollNumber: "",
        destination: "",
        purpose: "",
        dateTime: "",
        duration: "",
        parentEmail: "",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to submit request. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-balance mb-3">Request a Gatepass</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Fill out the form below to apply for campus exit permission
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>All fields are required. Your parent will receive an approval email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">
                    <User className="inline h-4 w-4 mr-2" />
                    Student Name
                  </Label>
                  <Input
                    id="studentName"
                    placeholder="Enter your full name"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rollNumber">
                    <Hash className="inline h-4 w-4 mr-2" />
                    Roll Number
                  </Label>
                  <Input
                    id="rollNumber"
                    placeholder="e.g., 21CS101"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Destination
                </Label>
                <Input
                  id="destination"
                  placeholder="Where are you going?"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">
                  <FileText className="inline h-4 w-4 mr-2" />
                  Purpose
                </Label>
                <Textarea
                  id="purpose"
                  placeholder="Reason for leaving campus"
                  rows={4}
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateTime">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    Date & Time
                  </Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">
                    <Clock className="inline h-4 w-4 mr-2" />
                    Duration
                  </Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 2 hours"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentEmail">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Parent Email
                </Label>
                <Input
                  id="parentEmail"
                  type="email"
                  placeholder="parent@example.com"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
