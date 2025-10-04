"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, BellOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingRow } from "./SettingRow";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function NotificationsSection() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleToggleNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Les notifications ne sont pas supportées par ce navigateur");
      return;
    }

    setLoading(true);

    if (Notification.permission === "granted") {
      // Désactiver les notifications
      setNotificationsEnabled(false);
      setLoading(false);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        setNotificationsEnabled(true);

        // Register service worker if not already registered
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registered:", registration);

          // Afficher notification de test
          new Notification("FleetZen", {
            body: "Les notifications sont activées !",
            icon: "/icons/icon-192x192.png",
          });
        }
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = () => {
    if (Notification.permission === "granted") {
      new Notification("FleetZen - Notification test", {
        body: "Ceci est une notification de test",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Recevez des alertes pour vos interventions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingRow
          icon={notificationsEnabled ? BellRing : BellOff}
          label="Activer les notifications"
          description={
            permission === "denied"
              ? "Autorisations refusées - Modifier dans les paramètres du navigateur"
              : "Recevoir des notifications push"
          }
        >
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={loading || permission === "denied"}
          />
        </SettingRow>

        {notificationsEnabled && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="w-full"
            >
              Tester les notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
