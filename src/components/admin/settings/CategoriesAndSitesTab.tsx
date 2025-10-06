'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Tags, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CategoriesAndSitesTabProps {
  initialCategories: string[];
  initialSites: string[];
}

export function CategoriesAndSitesTab({ initialCategories, initialSites }: CategoriesAndSitesTabProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [sites, setSites] = useState<string[]>(initialSites);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [siteDialog, setSiteDialog] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSite, setNewSite] = useState('');

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir une catégorie',
        variant: 'destructive',
      });
      return;
    }

    if (categories.includes(newCategory)) {
      toast({
        title: 'Erreur',
        description: 'Cette catégorie existe déjà',
        variant: 'destructive',
      });
      return;
    }

    setCategories([...categories, newCategory]);
    setNewCategory('');
    setCategoryDialog(false);

    toast({
      title: 'Catégorie ajoutée',
      description: `"${newCategory}" a été ajouté aux catégories`,
    });
  };

  const handleRemoveCategory = (category: string) => {
    if (!confirm(`Supprimer la catégorie "${category}" ?`)) {
      return;
    }

    setCategories(categories.filter((c) => c !== category));

    toast({
      title: 'Catégorie supprimée',
      description: `"${category}" a été supprimé`,
    });
  };

  const handleAddSite = () => {
    if (!newSite.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un site',
        variant: 'destructive',
      });
      return;
    }

    if (sites.includes(newSite)) {
      toast({
        title: 'Erreur',
        description: 'Ce site existe déjà',
        variant: 'destructive',
      });
      return;
    }

    setSites([...sites, newSite]);
    setNewSite('');
    setSiteDialog(false);

    toast({
      title: 'Site ajouté',
      description: `"${newSite}" a été ajouté aux sites`,
    });
  };

  const handleRemoveSite = (site: string) => {
    if (!confirm(`Supprimer le site "${site}" ?`)) {
      return;
    }

    setSites(sites.filter((s) => s !== site));

    toast({
      title: 'Site supprimé',
      description: `"${site}" a été supprimé`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Catégories de véhicules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Catégories de Véhicules
              </CardTitle>
              <CardDescription>
                Gérer les catégories disponibles pour les véhicules
              </CardDescription>
            </div>
            <Button onClick={() => setCategoryDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune catégorie configurée</p>
            ) : (
              categories.map((category) => (
                <Badge key={category} variant="outline" className="text-sm py-2 px-3">
                  {category}
                  <button
                    onClick={() => handleRemoveCategory(category)}
                    className="ml-2 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <p className="text-sm font-medium">Catégories actuelles (base de données) :</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">tracteur</Badge>
              <Badge variant="secondary">porteur</Badge>
              <Badge variant="secondary">remorque</Badge>
              <Badge variant="secondary">ensemble_complet</Badge>
              <Badge variant="secondary">autre</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note : Pour modifier les catégories en base, une migration SQL est nécessaire
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sites de travail */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Sites de Travail
              </CardTitle>
              <CardDescription>
                Gérer la liste des sites de travail disponibles
              </CardDescription>
            </div>
            <Button onClick={() => setSiteDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sites.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun site configuré</p>
            ) : (
              sites.map((site) => (
                <div
                  key={site}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{site}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSite(site)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Ajout Catégorie */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle catégorie de véhicule à la liste
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Nom de la catégorie</Label>
              <Input
                id="category"
                placeholder="Ex: Utilitaire, Camion, etc."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddCategory}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ajout Site */}
      <Dialog open={siteDialog} onOpenChange={setSiteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un site</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau site de travail à la liste
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="site">Nom du site</Label>
              <Input
                id="site"
                placeholder="Ex: LIDL - Paris Nord, Dépôt Central, etc."
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSiteDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddSite}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
