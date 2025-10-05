'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VehicleData } from '@/types/intervention'

interface AddVehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefilledClientId: string
  prefilledClientName: string
  prefilledSite: string
  prefilledCategory: string
  onVehicleCreated: (vehicle: VehicleData) => void
  onVehicleLink?: (vehicle: VehicleData) => void
}

export function AddVehicleDialog({
  open,
  onOpenChange,
  prefilledClientId,
  prefilledClientName,
  prefilledSite,
  prefilledCategory,
  onVehicleCreated,
  onVehicleLink
}: AddVehicleDialogProps) {
  const [licensePlate, setLicensePlate] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [tankCapacity, setTankCapacity] = useState('')

  const [checking, setChecking] = useState(false)
  const [creating, setCreating] = useState(false)
  const [existingVehicle, setExistingVehicle] = useState<VehicleData | null>(null)
  const [error, setError] = useState('')

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setLicensePlate('')
      setMake('')
      setModel('')
      setYear('')
      setFuelType('')
      setTankCapacity('')
      setExistingVehicle(null)
      setError('')
    }
  }, [open])

  // Check if license plate exists when user types
  useEffect(() => {
    const checkLicensePlate = async () => {
      if (!licensePlate || licensePlate.length < 3) {
        setExistingVehicle(null)
        return
      }

      setChecking(true)
      setError('')

      try {
        const response = await fetch('/api/vehicles/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licensePlate,
            clientId: prefilledClientId,
            site: prefilledSite
          })
        })

        const data = await response.json()

        if (data.success && data.otherLocations && data.otherLocations.length > 0) {
          setExistingVehicle(data.otherLocations[0])
        } else {
          setExistingVehicle(null)
        }
      } catch (err) {
        console.error('Error checking license plate:', err)
      } finally {
        setChecking(false)
      }
    }

    const debounce = setTimeout(checkLicensePlate, 500)
    return () => clearTimeout(debounce)
  }, [licensePlate, prefilledClientId, prefilledSite])

  const handleCreateNew = async () => {
    if (!licensePlate) {
      setError('Immatriculation requise')
      return
    }

    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licensePlate,
          clientId: prefilledClientId,
          site: prefilledSite,
          category: prefilledCategory,
          make: make || undefined,
          model: model || undefined,
          year: year ? parseInt(year) : undefined,
          fuelType: fuelType || undefined,
          tankCapacity: tankCapacity ? parseFloat(tankCapacity) : undefined
        })
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Erreur lors de la création')
        return
      }

      onVehicleCreated(data.vehicle)
      onOpenChange(false)
    } catch (err) {
      console.error('Error creating vehicle:', err)
      setError('Erreur lors de la création du véhicule')
    } finally {
      setCreating(false)
    }
  }

  const handleLinkExisting = async () => {
    if (!existingVehicle || !onVehicleLink) return

    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/vehicles/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceVehicleId: existingVehicle.id,
          clientId: prefilledClientId,
          site: prefilledSite
        })
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Erreur lors de la liaison')
        return
      }

      onVehicleLink(data.vehicle)
      onOpenChange(false)
    } catch (err) {
      console.error('Error linking vehicle:', err)
      setError('Erreur lors de la liaison du véhicule')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un véhicule</DialogTitle>
          <DialogDescription>
            Ajoutez les informations du nouveau véhicule
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pre-filled fields (disabled) */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Input value={prefilledClientName} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Site de travail</Label>
            <Input value={prefilledSite} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Type de véhicule</Label>
            <Input value={prefilledCategory} disabled className="bg-muted" />
          </div>

          {/* Editable fields */}
          <div className="space-y-2">
            <Label htmlFor="licensePlate">Immatriculation *</Label>
            <div className="relative">
              <Input
                id="licensePlate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="AA-123-BB"
                className="uppercase"
                autoComplete="off"
                data-form-type="other"
                data-1p-ignore
              />
              {checking && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {existingVehicle && (
            <Alert>
              <LinkIcon className="h-4 w-4" />
              <AlertDescription>
                Ce véhicule existe déjà pour <strong>{existingVehicle.clients?.name}</strong> sur le site <strong>{existingVehicle.work_site}</strong>.
                {onVehicleLink && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLinkExisting}
                      disabled={creating}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Liaison...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Lier ce véhicule
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="make">Marque</Label>
            <Input
              id="make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="Renault, Volvo, etc."
              autoComplete="off"
              data-1p-ignore
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modèle</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="FH16, T-Series, etc."
              autoComplete="off"
              data-1p-ignore
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelType">Carburant</Label>
              <Input
                id="fuelType"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                placeholder="Diesel"
                autoComplete="off"
                data-1p-ignore
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tankCapacity">Capacité (L)</Label>
              <Input
                id="tankCapacity"
                type="number"
                value={tankCapacity}
                onChange={(e) => setTankCapacity(e.target.value)}
                placeholder="400"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Annuler
          </Button>
          <Button onClick={handleCreateNew} disabled={creating || !licensePlate}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              'Créer le véhicule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
