"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Droplet, Fuel, Container } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MobileHeader } from "@/components/mobile/MobileHeader"
import { formatDateShort } from "@/lib/utils"
import type { InterventionType, InterventionStatus } from "@/types/intervention"

// Mock data
const mockInterventions = [
  {
    id: "1",
    type: "lavage" as InterventionType,
    vehicle: "AB-123-CD",
    client: "Jean Dupont",
    status: "completed" as InterventionStatus,
    date: new Date("2025-10-02T09:30:00"),
  },
  {
    id: "2",
    type: "carburant" as InterventionType,
    vehicle: "EF-456-GH",
    client: "Marie Martin",
    status: "completed" as InterventionStatus,
    date: new Date("2025-10-02T11:15:00"),
  },
  {
    id: "3",
    type: "cuve" as InterventionType,
    vehicle: "IJ-789-KL",
    client: "Pierre Bernard",
    status: "in_progress" as InterventionStatus,
    date: new Date("2025-10-02T14:00:00"),
  },
  {
    id: "4",
    type: "lavage" as InterventionType,
    vehicle: "MN-012-OP",
    client: "Sophie Durand",
    status: "completed" as InterventionStatus,
    date: new Date("2025-10-01T16:45:00"),
  },
  {
    id: "5",
    type: "carburant" as InterventionType,
    vehicle: "QR-345-ST",
    client: "Luc Petit",
    status: "completed" as InterventionStatus,
    date: new Date("2025-10-01T10:20:00"),
  },
]

export default function InterventionHistoryPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredInterventions = mockInterventions.filter(intervention => {
    const matchesSearch =
      intervention.vehicle.toLowerCase().includes(search.toLowerCase()) ||
      intervention.client.toLowerCase().includes(search.toLowerCase())

    const matchesType = filterType === "all" || intervention.type === filterType
    const matchesStatus = filterStatus === "all" || intervention.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const getInterventionIcon = (type: InterventionType) => {
    switch (type) {
      case "lavage": return Droplet
      case "carburant": return Fuel
      case "cuve": return Container
    }
  }

  const getInterventionLabel = (type: InterventionType) => {
    switch (type) {
      case "lavage": return "Lavage"
      case "carburant": return "Carburant"
      case "cuve": return "Cuve"
    }
  }

  const getStatusBadge = (status: InterventionStatus) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Terminé</span>
      case "in_progress":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">En cours</span>
      case "pending":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">En attente</span>
      case "cancelled":
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Annulé</span>
    }
  }

  return (
    <>
      <MobileHeader title="Historique" />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par véhicule ou client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="lavage">Lavage</SelectItem>
              <SelectItem value="carburant">Carburant</SelectItem>
              <SelectItem value="cuve">Cuve</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="space-y-2">
          {filteredInterventions.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Aucune intervention trouvée</p>
            </div>
          ) : (
            filteredInterventions.map((intervention) => {
              const Icon = getInterventionIcon(intervention.type)
              return (
                <Card
                  key={intervention.id}
                  className="cursor-pointer active:scale-98 transition-transform"
                  onClick={() => router.push(`/interventions/${intervention.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {getInterventionLabel(intervention.type)}
                          </span>
                          {getStatusBadge(intervention.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {intervention.vehicle} • {intervention.client}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateShort(intervention.date)}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <svg
                          className="h-5 w-5 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
