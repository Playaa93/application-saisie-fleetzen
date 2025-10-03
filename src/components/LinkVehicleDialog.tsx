'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, Link as LinkIcon, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LinkVehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: {
    id: string
    license_plate: string
    make?: string
    model?: string
    clients?: { name: string }
    work_site: string
  }
  targetClientName: string
  targetSite: string
  onConfirm: () => void
}

export function LinkVehicleDialog({
  open,
  onOpenChange,
  vehicle,
  targetClientName,
  targetSite,
  onConfirm
}: LinkVehicleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setError('')

    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      console.error('Error linking vehicle:', err)
      setError('Erreur lors de la liaison du véhicule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Lier un véhicule existant
          </DialogTitle>
          <DialogDescription>
            Ce véhicule existe déjà dans une autre configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Véhicule</div>
              <div className="text-lg font-semibold">{vehicle.license_plate}</div>
              {(vehicle.make || vehicle.model) && (
                <div className="text-sm text-muted-foreground">
                  {vehicle.make} {vehicle.model}
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Configuration actuelle
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Client:</span>{' '}
                  {vehicle.clients?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Site:</span>{' '}
                  {vehicle.work_site}
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Nouvelle configuration
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Client:</span>{' '}
                  {targetClientName}
                </div>
                <div>
                  <span className="font-medium">Site:</span>{' '}
                  {targetSite}
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              En confirmant, ce véhicule sera disponible pour les deux configurations.
              Les données du véhicule (marque, modèle, etc.) seront dupliquées.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Liaison...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Confirmer la liaison
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
