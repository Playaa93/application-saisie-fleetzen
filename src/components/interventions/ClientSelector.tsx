"use client"

import { useState } from "react"
import { Check, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Client } from "@/types/intervention"

interface ClientSelectorProps {
  clients: Client[]
  selectedClientId?: string
  onSelect: (clientId: string) => void
  required?: boolean
}

export function ClientSelector({
  clients,
  selectedClientId,
  onSelect,
  required = false
}: ClientSelectorProps) {
  const [search, setSearch] = useState("")

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.company?.toLowerCase().includes(search.toLowerCase()) ||
    client.phone.includes(search)
  )

  const selectedClient = clients.find(c => c.id === selectedClientId)

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1">
        Client
        {required && <span className="text-destructive">*</span>}
      </Label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
        {filteredClients.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucun client trouvé
          </div>
        ) : (
          filteredClients.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => onSelect(client.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 text-left transition-colors touch-manipulation",
                "hover:bg-accent active:bg-accent/70",
                selectedClientId === client.id && "bg-accent"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-5 w-5 rounded-full border-2 shrink-0",
                selectedClientId === client.id
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              )}>
                {selectedClientId === client.id && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base truncate">{client.name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {client.company && `${client.company} • `}{client.phone}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedClient && (
        <div className="p-3 bg-accent rounded-lg">
          <div className="text-sm font-medium">Client sélectionné:</div>
          <div className="text-base font-semibold mt-1">{selectedClient.name}</div>
          {selectedClient.company && (
            <div className="text-sm text-muted-foreground">{selectedClient.company}</div>
          )}
          <div className="text-sm text-muted-foreground">{selectedClient.phone}</div>
        </div>
      )}
    </div>
  )
}
