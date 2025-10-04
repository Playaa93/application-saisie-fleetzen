"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Shield, Calendar, Settings, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/mobile/BottomNav";
import { ActivityChart } from "@/components/dashboard/ActivityChart";

interface AgentProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  memberSince: string;
}

interface AgentStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  recent: number;
  byType: Record<string, number>;
  completionRate: number;
}

export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("sb-access-token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/agents/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          localStorage.clear();
          router.push("/login");
          return;
        }
        setError(result.error || "Erreur lors du chargement du profil");
        return;
      }

      setProfile(result.data.profile);
      setStats(result.data.stats);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "sb-access-token=; path=/; max-age=0";
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Erreur</CardTitle>
            <CardDescription>{error || "Profil non trouvé"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    admin: "Administrateur",
    supervisor: "Superviseur",
    field_agent: "Agent terrain",
  };

  return (
    <>
    <div className="flex-1 p-4 space-y-4 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mon Profil</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/parametres")}
            title="Paramètres"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleLogout} title="Déconnexion">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{profile.fullName}</CardTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Badge variant={profile.isActive ? "default" : "secondary"}>
                    {profile.isActive ? "Actif" : "Inactif"}
                  </Badge>
                  <span>{roleLabels[profile.role] || profile.role}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Téléphone:</span>
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Rôle:</span>
              <span>{roleLabels[profile.role] || profile.role}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Membre depuis:</span>
              <span>{new Date(profile.memberSince).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Chart */}
      <ActivityChart />

      {/* Activity Summary - Non-comparative */}
      <Card>
        <CardHeader>
          <CardTitle>Mon activité</CardTitle>
          <CardDescription>Répartition de vos interventions par type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{type}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    <BottomNav />
    </>
  );
}
