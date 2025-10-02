"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { MobileHeader } from "@/components/mobile/MobileHeader"
import { InterventionForm } from "@/components/interventions/InterventionForm"
import type { InterventionType } from "@/types/intervention"

const validTypes: InterventionType[] = ["lavage", "carburant", "cuve"]

export default function InterventionFormPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = use(params)

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
    <>
      <MobileHeader title={getTitle()} showBack />

      <div className="p-4">
        <InterventionForm type={type as InterventionType} />
      </div>
    </>
  )
}
