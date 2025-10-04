"use client";

import { Info, Package, HelpCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingRow } from "./SettingRow";

export function AboutSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          À propos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <SettingRow
          icon={Package}
          label="Version"
          description="1.0.0"
        />
        <SettingRow
          icon={HelpCircle}
          label="Aide & Support"
          description="Contactez l'assistance"
          onClick={() => {
            // TODO: Ouvrir lien support ou modale
            alert("Support: support@fleetzen.com");
          }}
        />
        <SettingRow
          icon={FileText}
          label="Mentions légales"
          description="Conditions d'utilisation et confidentialité"
          onClick={() => {
            // TODO: Ouvrir page mentions légales
            alert("Fonctionnalité à venir");
          }}
        />
      </CardContent>
    </Card>
  );
}
