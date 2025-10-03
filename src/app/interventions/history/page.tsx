"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  const [filterDate, setFilterDate] = useState<string>("all")
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/interventions')
      .then(async res => {
        console.log('📡 Response status:', res.status, res.statusText);
        console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()));

        const contentType = res.headers.get('content-type');
        console.log('📡 Content-Type:', contentType);

        if (!res.ok) {
          const text = await res.text();
          console.error('❌ Response not OK:', text);
          throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
        }

        if (!contentType?.includes('application/json')) {
          const text = await res.text();
          console.error('❌ Not JSON response:', text.substring(0, 500));
          throw new Error('La réponse n\'est pas du JSON');
        }

        return res.json();
      })
      .then(data => {
        console.log('✅ Interventions loaded:', data.interventions?.length || 0);
        setInterventions(data.interventions || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('❌ Erreur chargement interventions:', err)
        console.error('❌ Error details:', err.message, err.stack);
        setLoading(false)
      })
  }, [])

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch =
      (intervention.vehicule?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (intervention.client?.toLowerCase() || '').includes(search.toLowerCase())

    // Normaliser le type pour la comparaison
    const normalizeType = (type: string): string => {
      return type.toLowerCase().replace(/\s+/g, '-')
    }

    const normalized = normalizeType(intervention.type)
    const matchesType = filterType === "all" || normalized === filterType

    // Filtre par date
    let matchesDate = true
    if (filterDate !== "all") {
      const interventionDate = new Date(intervention.creeLe)
      const now = new Date()

      if (filterDate === "today") {
        matchesDate = interventionDate.toDateString() === now.toDateString()
      } else if (filterDate === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = interventionDate >= weekAgo
      } else if (filterDate === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDate = interventionDate >= monthAgo
      }
    }

    return matchesSearch && matchesType && matchesDate
  })

  const hasActiveFilters = search !== "" || filterType !== "all" || filterDate !== "all"

  const resetFilters = () => {
    setSearch("")
    setFilterType("all")
    setFilterDate("all")
  }

  const getInterventionIcon = (type: string) => {
    const normalized = type.toLowerCase().replace(/\s+/g, '-')

    // Icône Lavage - Spray moderne avec gouttelettes
    if (normalized === "lavage-véhicule") {
      return () => (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
          <path d="M12 6v3M12 15v3M6 12h3M15 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="9" cy="9" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="15" cy="9" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="9" cy="15" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="15" cy="15" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>
      )
    }

    // Icône Livraison - Truck épuré et moderne
    if (normalized === "livraison-carburant") {
      return () => (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 8h13v8H2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
          <path d="M15 10h3l3 3v3h-6v-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" opacity="0.15"/>
          <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <circle cx="17" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M15 16h-1M2 16h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        </svg>
      )
    }

    // Icône Remplissage Cuve - Tank moderne avec niveau
    if (normalized === "remplissage-cuve") {
      return () => (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <rect x="4" y="13" width="16" height="7" rx="2" fill="currentColor" opacity="0.2"/>
          <path d="M4 10h16M4 13h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
          <circle cx="19" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.3"/>
          <path d="M19 6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        </svg>
      )
    }

    // Icône par défaut
    return () => (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    )
  }

  const getInterventionColor = (type: string) => {
    const normalized = type.toLowerCase().replace(/\s+/g, '-')

    if (normalized === "lavage-véhicule") return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    if (normalized === "livraison-carburant") return "bg-orange-500/10 text-orange-600 dark:text-orange-400"
    if (normalized === "remplissage-cuve") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    return "bg-primary/10 text-primary"
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="lavage-véhicule">Lavage</SelectItem>
                <SelectItem value="livraison-carburant">Carburant Livraison</SelectItem>
                <SelectItem value="remplissage-cuve">Remplissage Cuve</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Result Counter & Reset Button */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filteredInterventions.length} intervention{filteredInterventions.length > 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
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
              const colorClass = getInterventionColor(intervention.type)
              return (
                <Card
                  key={intervention.id}
                  className="cursor-pointer active:scale-98 transition-transform"
                  onClick={() => router.push(`/interventions/${intervention.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {getInterventionLabel(intervention.type as InterventionType)}
                          </span>
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
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
