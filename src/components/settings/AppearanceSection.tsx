"use client";

import { useTheme } from "next-themes";
import { Palette, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingRow } from "./SettingRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Apparence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <SettingRow
          icon={Palette}
          label="Thème"
          description="Choisir l'apparence de l'application"
        >
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Thème" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Clair</SelectItem>
              <SelectItem value="dark">Sombre</SelectItem>
              <SelectItem value="system">Auto</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow
          icon={Globe}
          label="Langue"
          description="Langue de l'interface"
        >
          <Select value="fr" disabled>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </CardContent>
    </Card>
  );
}
