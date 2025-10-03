"use client"

export const dynamic = 'force-dynamic'

import { useRouter } from "next/navigation"
import { Droplet, Fuel, Container } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/mobile/MobileHeader"
import { AppShell } from "@/components/mobile/AppShell"
import type { InterventionType } from "@/types/intervention"

const interventionTypes = [
  {
    type: "lavage" as InterventionType,
    icon: Droplet,
    title: "Lavage",
    description: "Nettoyage intérieur/extérieur du véhicule",
    color: "bg-blue-500",
  },
  {
    type: "carburant" as InterventionType,
    icon: Fuel,
    title: "Carburant",
    description: "Ravitaillement en carburant",
    color: "bg-green-500",
  },
  {
    type: "cuve" as InterventionType,
    icon: Container,
    title: "Cuve",
    description: "Inspection, nettoyage ou remplissage de cuve",
    color: "bg-orange-500",
  },
]

export default function NewInterventionPage() {
  const router = useRouter()

  const handleSelectType = (type: InterventionType) => {
    router.push(`/interventions/form/${type}`)
  }

  return (
    <AppShell>
      <MobileHeader title="Nouvelle Intervention" showBack />

      <div className="p-4 space-y-4">
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            Sélectionnez le type d&apos;intervention à effectuer
          </p>
        </div>

        <div className="space-y-3">
          {interventionTypes.map((item) => {
            const Icon = item.icon
            return (
              <Card
                key={item.type}
                className="cursor-pointer active:scale-98 transition-transform hover:shadow-md"
                onClick={() => handleSelectType(item.type)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`${item.color} p-3 rounded-lg shrink-0`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-1">{item.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {item.description}
                      </CardDescription>
                    </div>
                    <div className="shrink-0">
                      <svg
                        className="h-6 w-6 text-muted-foreground"
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
          })}
        </div>
      </div>
    </AppShell>
  )
}
