"use client"

import { useState } from "react"
import { Check, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Vehicle } from "@/types/intervention"

interface VehicleSelectorProps {
  vehicles: Vehicle[]
  selectedVehicleId?: string
  onSelect: (vehicleId: string) => void
  required?: boolean
}

export function VehicleSelector({
  vehicles,
  selectedVehicleId,
  onSelect,
  required = false
}: VehicleSelectorProps) {
  const [search, setSearch] = useState("")

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(search.toLowerCase())
  )

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1">
        Véhicule
        {required && <span className="text-destructive">*</span>}
      </Label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un véhicule..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
        {filteredVehicles.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucun véhicule trouvé
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => onSelect(vehicle.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 text-left transition-colors touch-manipulation",
                "hover:bg-accent active:bg-accent/70",
                selectedVehicleId === vehicle.id && "bg-accent"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-5 w-5 rounded-full border-2 shrink-0",
                selectedVehicleId === vehicle.id
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              )}>
                {selectedVehicleId === vehicle.id && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base">{vehicle.plateNumber}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {vehicle.brand} {vehicle.model} • {vehicle.type}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedVehicle && (
        <div className="p-3 bg-accent rounded-lg">
          <div className="text-sm font-medium">Véhicule sélectionné:</div>
          <div className="text-base font-semibold mt-1">{selectedVehicle.plateNumber}</div>
          <div className="text-sm text-muted-foreground">
            {selectedVehicle.brand} {selectedVehicle.model}
          </div>
        </div>
      )}
    </div>
  )
}
