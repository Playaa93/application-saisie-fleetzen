import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Info, FileText, Tags, Palette, Shield } from 'lucide-react';
import { GeneralTab } from '@/components/admin/settings/GeneralTab';
import { InterventionTypesTab } from '@/components/admin/settings/InterventionTypesTab';
import { CategoriesAndSitesTab } from '@/components/admin/settings/CategoriesAndSitesTab';
import { AppearanceTab } from '@/components/admin/settings/AppearanceTab';
import { SecurityTab } from '@/components/admin/settings/SecurityTab';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = await createClient();

  // Fetch data for GeneralTab
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: totalInterventionTypes } = await supabase
    .from('intervention_types')
    .select('*', { count: 'exact', head: true });

  // Fetch intervention types for InterventionTypesTab
  const { data: interventionTypes } = await supabase
    .from('intervention_types')
    .select('*')
    .order('name');

  // Fetch distinct categories and sites for CategoriesAndSitesTab
  // Categories are from enum, so we'll hardcode them
  const categories = ['tracteur', 'porteur', 'remorque', 'ensemble_complet', 'autre'];

  // Fetch distinct sites
  const { data: sitesData } = await supabase
    .from('vehicles')
    .select('work_site')
    .not('work_site', 'is', null)
    .neq('work_site', '');

  const sites = Array.from(
    new Set(sitesData?.map((v) => v.work_site).filter(Boolean))
  ).sort() as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Configuration et gestion de l'application FleetZen
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="intervention-types" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Types d'Interventions</span>
          </TabsTrigger>
          <TabsTrigger value="categories-sites" className="gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Catégories & Sites</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Apparence</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab
            stats={{
              totalUsers: totalUsers || 0,
              totalInterventionTypes: totalInterventionTypes || 0,
            }}
          />
        </TabsContent>

        <TabsContent value="intervention-types">
          <InterventionTypesTab initialTypes={interventionTypes || []} />
        </TabsContent>

        <TabsContent value="categories-sites">
          <CategoriesAndSitesTab
            initialCategories={categories}
            initialSites={sites}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
