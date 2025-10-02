import { BottomNav } from "@/components/mobile/BottomNav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <main className="flex-1">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
