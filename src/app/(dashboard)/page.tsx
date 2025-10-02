"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/mobile/MobileHeader"

// Mock data
const stats = {
  today: 3,
  completed: 12,
  pending: 5,
  total: 47
}

const recentInterventions = [
  {
    id: "1",
    type: "lavage",
    vehicle: "AB-123-CD",
    client: "Jean Dupont",
    status: "completed",
    time: "09:30"
  },
  {
    id: "2",
    type: "carburant",
    vehicle: "EF-456-GH",
    client: "Marie Martin",
    status: "completed",
    time: "11:15"
  },
  {
    id: "3",
    type: "cuve",
    vehicle: "IJ-789-KL",
    client: "Pierre Bernard",
    status: "in_progress",
    time: "14:00"
  }
]

export default function DashboardPage() {
  const router = useRouter()
  const [agentName, setAgentName] = useState("")

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/login")
      return
    }

    const name = localStorage.getItem("agentName") || "Agent"
    setAgentName(name.charAt(0).toUpperCase() + name.slice(1))
  }, [router])

  const getInterventionTypeLabel = (type: string) => {
    switch (type) {
      case "lavage": return "Lavage"
      case "carburant": return "Carburant"
      case "cuve": return "Cuve"
      default: return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Terminé</span>
      case "in_progress":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">En cours</span>
      case "pending":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">En attente</span>
      default:
        return null
    }
  }

  if (!agentName) return null

  return (
    <>
      <MobileHeader title={`Bonjour, ${agentName}`} />

      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Aujourd&apos;hui</CardDescription>
              <CardTitle className="text-2xl font-bold">{stats.today}</CardTitle>
            </CardHeader>
            <CardContent>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Terminées</CardDescription>
              <CardTitle className="text-2xl font-bold">{stats.completed}</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">En attente</CardDescription>
              <CardTitle className="text-2xl font-bold">{stats.pending}</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total mois</CardDescription>
              <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Interventions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Interventions récentes</h2>

          <div className="space-y-2">
            {recentInterventions.map((intervention) => (
              <Card
                key={intervention.id}
                className="cursor-pointer active:scale-98 transition-transform"
                onClick={() => router.push(`/interventions/${intervention.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base">
                          {getInterventionTypeLabel(intervention.type)}
                        </span>
                        {getStatusBadge(intervention.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {intervention.vehicle} • {intervention.client}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0">
                      {intervention.time}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-4">
            <button
              onClick={() => router.push("/interventions/new")}
              className="w-full text-left"
            >
              <div className="text-lg font-semibold mb-1">Nouvelle intervention</div>
              <div className="text-sm opacity-90">
                Commencer une nouvelle intervention terrain
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
