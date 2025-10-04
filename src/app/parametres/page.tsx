import { Metadata } from "next";
import { Settings } from "lucide-react";
import { AccountSection } from "@/components/settings/AccountSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { DataSection } from "@/components/settings/DataSection";
import { AboutSection } from "@/components/settings/AboutSection";
import { BottomNav } from "@/components/mobile/BottomNav";

export const metadata: Metadata = {
  title: "Paramètres - FleetZen",
  description: "Configurez votre application",
};

export default function ParametresPage() {
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Paramètres</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <AccountSection />
        <AppearanceSection />
        <NotificationsSection />
        <DataSection />
        <AboutSection />
      </div>

      <BottomNav />
    </div>
  );
}
