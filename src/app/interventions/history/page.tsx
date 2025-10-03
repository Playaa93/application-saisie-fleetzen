"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Droplet, Fuel, Container } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MobileHeader } from "@/components/mobile/MobileHeader"
import { AppShell } from "@/components/mobile/AppShell"
import { formatDateShort } from "@/lib/utils"
import type { InterventionType, InterventionStatus } from "@/types/intervention"

interface Intervention {
  id: number
  type: string
  client: string
  vehicule: string
  creeLe: string
}

export default function InterventionHistoryPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/interventions')
      .then(res => res.json())
      .then(data => {
        setInterventions(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Erreur chargement interventions:', err)
        setLoading(false)
      })
  }, [])

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch =
      intervention.vehicule.toLowerCase().includes(search.toLowerCase()) ||
      intervention.client.toLowerCase().includes(search.toLowerCase())

    const matchesType = filterType === "all" || intervention.type === filterType

    return matchesSearch && matchesType
  })

  const getInterventionIcon = (type: string) => {
    if (type === "lavage") return Droplet
    if (type === "carburant-livraison" || type === "carburant-cuve") return Fuel
    return Container
  }

  const getInterventionLabel = (type: string) => {
    if (type === "lavage") return "Lavage"
    if (type === "carburant-livraison") return "Carburant Livraison"
    if (type === "carburant-cuve") return "Carburant Cuve"
    return type
  }

  if (loading) {
    return (
      <AppShell>
        <MobileHeader title="Historique" />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
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
        <div className="grid grid-cols-1 gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="lavage">Lavage</SelectItem>
              <SelectItem value="carburant-livraison">Carburant Livraison</SelectItem>
              <SelectItem value="carburant-cuve">Carburant Cuve</SelectItem>
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
              const Icon = getInterventionIcon(intervention.type as InterventionType)
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
                            {getInterventionLabel(intervention.type as InterventionType)}
                          </span>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                            Terminé
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {intervention.vehicule} • {intervention.client}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateShort(new Date(intervention.creeLe))}
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
    </AppShell>
  )
}
