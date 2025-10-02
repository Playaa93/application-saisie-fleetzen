"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Phone, MapPin, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/mobile/MobileHeader"

export default function ProfilePage() {
  const router = useRouter()
  const [agentName, setAgentName] = useState("")

  useEffect(() => {
    const name = localStorage.getItem("agentName") || "Agent"
    setAgentName(name.charAt(0).toUpperCase() + name.slice(1))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("agentName")
    router.push("/login")
  }

  // Mock data
  const agentInfo = {
    email: `${agentName.toLowerCase()}@fleetzen.com`,
    phone: "+33 6 12 34 56 78",
    location: "Paris, Île-de-France",
    employeeId: "FZ-2024-001",
    joinDate: "Janvier 2024",
  }

  const stats = {
    totalInterventions: 47,
    thisMonth: 12,
    rating: 4.8,
  }

  return (
    <>
      <MobileHeader title="Profil" />

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-1">{agentName}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Agent Terrain • {agentInfo.employeeId}
              </p>

              <div className="grid grid-cols-3 gap-4 w-full mt-4 pt-4 border-t">
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.totalInterventions}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.thisMonth}</div>
                  <div className="text-xs text-muted-foreground">Ce mois</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.rating}</div>
                  <div className="text-xs text-muted-foreground">Note</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>Coordonnées de contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent rounded-lg shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Email</div>
                <div className="text-sm text-muted-foreground truncate">{agentInfo.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent rounded-lg shrink-0">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Téléphone</div>
                <div className="text-sm text-muted-foreground">{agentInfo.phone}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent rounded-lg shrink-0">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Localisation</div>
                <div className="text-sm text-muted-foreground">{agentInfo.location}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {/* TODO: Implement settings */}}
          >
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Membre depuis {agentInfo.joinDate}</p>
          <p className="mt-1">FleetZen v1.0.0</p>
        </div>
      </div>
    </>
  )
}
