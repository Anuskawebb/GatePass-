"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import { getAllGatepassRequests } from "@/app/actions/gatepass"
import type { GatepassRequest } from "@/lib/types"

const statusConfig = {
  "Pending Parent Approval": {
    label: "Pending Parent",
    variant: "secondary" as const,
    className: "bg-warning text-warning-foreground",
  },
  "Approved by Parent": {
    label: "Parent Approved",
    variant: "default" as const,
    className: "bg-success text-success-foreground",
  },
  "Rejected by Parent": { label: "Parent Rejected", variant: "destructive" as const },
  "Warden Approved": {
    label: "Warden Approved",
    variant: "default" as const,
    className: "bg-success text-success-foreground",
  },
  "Warden Denied": { label: "Warden Denied", variant: "destructive" as const },
  Completed: { label: "Completed", variant: "secondary" as const },
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [gatepasses, setGatepasses] = useState<GatepassRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGatepasses = async () => {
      setLoading(true)
      setError(null)

      const result = await getAllGatepassRequests()

      if (result.success && result.data) {
        setGatepasses(result.data)
      } else {
        setError(result.error || "Failed to load gatepasses")
      }

      setLoading(false)
    }

    fetchGatepasses()

    const interval = setInterval(fetchGatepasses, 10000)
    return () => clearInterval(interval)
  }, [])

  const filteredGatepasses = gatepasses.filter(
    (pass) =>
      pass.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pass.roll_number.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-balance mb-3">Warden & Security Dashboard</h1>
        <p className="text-lg text-muted-foreground">View and manage all gatepass requests in real-time</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Gatepasses</CardTitle>
          <CardDescription>Track student movements and approval status</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="ml-4 text-muted-foreground">Loading gatepasses...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">{error}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Roll Number</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="hidden md:table-cell">Purpose</TableHead>
                    <TableHead className="hidden lg:table-cell">Date/Time</TableHead>
                    <TableHead className="hidden sm:table-cell">Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGatepasses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No gatepasses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGatepasses.map((pass) => (
                      <TableRow key={pass.id}>
                        <TableCell className="font-medium">{pass.student_name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{pass.roll_number}</TableCell>
                        <TableCell>{pass.destination}</TableCell>
                        <TableCell className="hidden md:table-cell">{pass.purpose}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatDateTime(pass.departure_datetime)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{pass.duration}</TableCell>
                        <TableCell>
                          <Badge
                            variant={statusConfig[pass.status as keyof typeof statusConfig].variant}
                            className={statusConfig[pass.status as keyof typeof statusConfig].className}
                          >
                            {statusConfig[pass.status as keyof typeof statusConfig].label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
