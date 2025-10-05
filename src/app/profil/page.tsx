import Link from 'next/link';
import { User, Mail, Phone, Shield, Calendar, Settings, LogOut, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/mobile/BottomNav';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { getAgentProfile, getAgentActivityChart } from '@/lib/dal';
import { LogoutButton } from './LogoutButton';

/**
 * ProfilPage - Server Component (Next.js 15 Best Practice)
 *
 * Data fetching happens server-side via DAL.
 * Auth is verified automatically in getAgentProfile().
 * No client-side data fetching = no 401 errors, no flash of unauthenticated content.
 */
export default async function ProfilPage() {
  // ✅ Auth verified automatically in DAL
  // ✅ Data fetched server-side
  const { profile, stats } = await getAgentProfile();
  const chartData = await getAgentActivityChart();
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';

  const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    supervisor: 'Superviseur',
    field_agent: 'Agent terrain',
  };

  return (
    <div className="flex-1 p-4 space-y-4 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mon Profil</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              asChild
            >
              <Link href="/admin">
                <ArrowLeftRight className="h-4 w-4" />
                Mode admin
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            title="Paramètres"
            asChild
          >
            <Link href="/parametres">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <LogoutButton />
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
                  <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                    {profile.isActive ? 'Actif' : 'Inactif'}
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
              <span>{new Date(profile.memberSince).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Chart - receives pre-authenticated data */}
      <ActivityChart chartData={chartData} />

      {/* Activity Summary */}
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

      <BottomNav />
    </div>
  );
}
