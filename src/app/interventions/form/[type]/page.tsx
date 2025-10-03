"use client"

import { notFound } from "next/navigation"
import { MobileHeader } from "@/components/mobile/MobileHeader"
import { AppShell } from "@/components/mobile/AppShell"
import { InterventionForm } from "@/components/interventions/InterventionForm"
import type { InterventionType } from "@/types/intervention"

const validTypes: InterventionType[] = ["lavage", "carburant", "cuve"]

export default function InterventionFormPage({
  params,
}: {
  params: { type: string }
}) {
  const { type } = params

  if (!validTypes.includes(type as InterventionType)) {
    notFound()
  }

  const getTitle = () => {
    switch (type) {
      case "lavage": return "Formulaire Lavage"
      case "carburant": return "Formulaire Carburant"
      case "cuve": return "Formulaire Cuve"
      default: return "Intervention"
    }
  }

  return (
    <AppShell>
      <MobileHeader title={getTitle()} showBack />

      <div className="p-4">
        <InterventionForm type={type as InterventionType} />
      </div>
    </AppShell>
  )
}
