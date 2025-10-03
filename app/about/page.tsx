import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Zap, Lock, Users } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-balance mb-4">What is GateFlow?</h1>
          <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
            GateFlow is a fast and secure digital gatepass management system for colleges. Students request passes,
            parents approve instantly via email/SMS, and wardens & security staff track approvals in real-time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Submit requests in seconds and get instant parent approvals via email. No more paper forms or waiting in
                queues.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="rounded-lg bg-accent/10 w-12 h-12 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Secure & Reliable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Built with security in mind. All data is encrypted and parent verification ensures authentic approvals
                every time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="rounded-lg bg-success/10 w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <CardTitle>Real-Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Wardens and security staff can monitor all approved gatepasses in real-time with an intuitive dashboard
                interface.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="rounded-lg bg-warning/10 w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>Everyone Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Students get freedom, parents get peace of mind, and campus security maintains complete visibility and
                control.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">Ready to modernize your campus?</h2>
              <p className="text-primary-foreground/90 leading-relaxed">
                Join hundreds of colleges already using GateFlow to streamline campus mobility and enhance security with
                digital gatepass management.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
