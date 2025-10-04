"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, History, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/",
    icon: Home,
    label: "Accueil",
  },
  {
    href: "/nouvelle-intervention",
    icon: Plus,
    label: "Nouvelle",
  },
  {
    href: "/interventions/history",
    icon: History,
    label: "Historique",
  },
  {
    href: "/profil",
    icon: User,
    label: "Profil",
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 touch-manipulation transition-colors",
                "active:bg-accent/50 rounded-lg",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-all",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-xs font-medium truncate",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
