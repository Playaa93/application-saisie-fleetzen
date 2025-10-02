"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface MobileHeaderProps {
  title: string
  showBack?: boolean
  action?: React.ReactNode
}

export function MobileHeader({ title, showBack = false, action }: MobileHeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        {action && <div className="shrink-0 ml-2">{action}</div>}
      </div>
    </header>
  )
}
