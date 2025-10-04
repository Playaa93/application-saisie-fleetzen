"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhotoCapture } from "./PhotoCapture"
import { VehicleSelector } from "./VehicleSelector"
import { ClientSelector } from "./ClientSelector"
import { useOfflineSubmit } from "@/hooks/useOfflineSubmit"
import { useToast } from "@/hooks/use-toast"
import type { InterventionType, Vehicle, Client } from "@/types/intervention"

// Mock data
const mockVehicles: Vehicle[] = [
  { id: "1", plateNumber: "AB-123-CD", brand: "Renault", model: "Trafic", type: "Fourgon" },
  { id: "2", plateNumber: "EF-456-GH", brand: "Peugeot", model: "Partner", type: "Utilitaire" },
  { id: "3", plateNumber: "IJ-789-KL", brand: "Citroën", model: "Berlingo", type: "Utilitaire" },
]

const mockClients: Client[] = [
  { id: "1", name: "Jean Dupont", company: "TransportCo", phone: "06 12 34 56 78", address: "Paris" },
  { id: "2", name: "Marie Martin", company: "LogisticPro", phone: "06 23 45 67 89", address: "Lyon" },
  { id: "3", name: "Pierre Bernard", phone: "06 34 56 78 90", address: "Marseille" },
]

interface InterventionFormProps {
  type: InterventionType
}

export function InterventionForm({ type }: InterventionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { submitIntervention, isSubmitting, isOnline } = useOfflineSubmit()

  const [vehicleId, setVehicleId] = useState("")
  const [clientId, setClientId] = useState("")
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<{ before?: File; after?: File }>({})

  // Type-specific state
  const [washType, setWashType] = useState("")
  const [products, setProducts] = useState("")
  const [fuelType, setFuelType] = useState("")
  const [quantity, setQuantity] = useState("")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [taskType, setTaskType] = useState("")
  const [currentLevel, setCurrentLevel] = useState("")

  const handlePhotoCapture = (file: File, photoType: string) => {
    setPhotos(prev => ({ ...prev, [photoType]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Préparer les données de l'intervention
    const interventionData = {
      type,
      vehicleId,
      clientId,
      notes,
      // Type-specific data
      ...(type === "lavage" && {
        washType,
        products: products.split(",").map(p => p.trim())
      }),
      ...(type === "carburant" && {
        fuelType,
        quantity: parseFloat(quantity),
        pricePerUnit: parseFloat(pricePerUnit)
      }),
      ...(type === "cuve" && {
        taskType,
        currentLevel: parseFloat(currentLevel)
      }),
    }

    // Convertir les photos File en Blob
    const photoBlobs = photos.before || photos.after
      ? {
          before: photos.before,
          after: photos.after,
        }
      : undefined

    // Utiliser le hook offline-first
    await submitIntervention(
      interventionData,
      photoBlobs,
      {
        apiEndpoint: "/api/interventions",
        onSuccess: () => {
          toast({
            title: isOnline ? "Intervention enregistrée" : "Intervention enregistrée hors ligne",
            description: isOnline
              ? "L'intervention a été synchronisée avec succès"
              : "L'intervention sera synchronisée dès que la connexion sera rétablie",
          })
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: error.message || "Une erreur est survenue lors de l'enregistrement",
          })
        },
      }
    )
  }

  const renderTypeSpecificFields = () => {
    switch (type) {
      case "lavage":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="washType">Type de lavage *</Label>
              <Select value={washType} onValueChange={setWashType} required>
                <SelectTrigger id="washType">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exterior">Extérieur</SelectItem>
                  <SelectItem value="interior">Intérieur</SelectItem>
                  <SelectItem value="complete">Complet</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="products">Produits utilisés</Label>
              <Input
                id="products"
                placeholder="Ex: Shampooing, Cire, Polish (séparés par virgule)"
                value={products}
                onChange={(e) => setProducts(e.target.value)}
              />
            </div>
          </>
        )

      case "carburant":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="fuelType">Type de carburant *</Label>
              <Select value={fuelType} onValueChange={setFuelType} required>
                <SelectTrigger id="fuelType">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="essence">Essence</SelectItem>
                  <SelectItem value="gpl">GPL</SelectItem>
                  <SelectItem value="electric">Électrique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité (L) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  placeholder="50.0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerUnit">Prix/L (€) *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  step="0.01"
                  placeholder="1.65"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  required
                />
              </div>
            </div>

            {quantity && pricePerUnit && (
              <div className="p-3 bg-accent rounded-lg">
                <div className="text-sm font-medium">Total à payer:</div>
                <div className="text-2xl font-bold text-primary">
                  {(parseFloat(quantity) * parseFloat(pricePerUnit)).toFixed(2)} €
                </div>
              </div>
            )}
          </>
        )

      case "cuve":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="taskType">Type de tâche *</Label>
              <Select value={taskType} onValueChange={setTaskType} required>
                <SelectTrigger id="taskType">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="cleaning">Nettoyage</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="filling">Remplissage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentLevel">Niveau actuel (%)</Label>
              <Input
                id="currentLevel"
                type="number"
                min="0"
                max="100"
                placeholder="75"
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  const getTitle = () => {
    switch (type) {
      case "lavage": return "Lavage"
      case "carburant": return "Carburant"
      case "cuve": return "Cuve"
      default: return "Intervention"
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <VehicleSelector
        vehicles={mockVehicles}
        selectedVehicleId={vehicleId}
        onSelect={setVehicleId}
        required
      />

      <ClientSelector
        clients={mockClients}
        selectedClientId={clientId}
        onSelect={setClientId}
        required
      />

      {renderTypeSpecificFields()}

      <div className="space-y-4">
        <PhotoCapture
          type="before"
          label="Photo avant"
          onPhotoCapture={handlePhotoCapture}
          required
        />

        <PhotoCapture
          type="after"
          label="Photo après"
          onPhotoCapture={handlePhotoCapture}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes complémentaires</Label>
        <Textarea
          id="notes"
          placeholder="Observations, remarques, détails supplémentaires..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || !vehicleId || !clientId}
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Enregistrement...
            </>
          ) : (
            `Valider ${getTitle()}`
          )}
        </Button>
      </div>
    </form>
  )
}
