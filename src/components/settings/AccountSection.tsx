"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key, LogOut, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingRow } from "./SettingRow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AccountSection() {
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "sb-access-token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingRow
            icon={Key}
            label="Modifier le mot de passe"
            description="Changer votre mot de passe"
            onClick={() => {
              // TODO: Implémenter changement mot de passe
              alert("Fonctionnalité à venir");
            }}
          />
          <SettingRow
            icon={LogOut}
            label="Déconnexion"
            description="Se déconnecter de l'application"
            danger
            onClick={() => setShowLogoutDialog(true)}
          />
        </CardContent>
      </Card>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ? Vos données non synchronisées seront conservées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Déconnexion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
