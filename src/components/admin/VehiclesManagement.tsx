'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Search, Plus, Pencil, Trash2, MapPin, Loader2, Truck, Filter, X, Building2, Tags, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type Vehicle = {
  id: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vehicle_category: string | null;
  work_site: string | null;
  client: {
    id: string;
    name: string;
  } | null;
  created_at: string;
};

interface VehiclesManagementProps {
  clientId?: string; // Si fourni, filtre uniquement les véhicules de ce client
  mode?: 'global' | 'client'; // Mode d'affichage
  initialVehicles?: Vehicle[]; // Véhicules initiaux (si fournis par Server Component)
  availableClients?: Array<{ id: string; name: string }>; // Liste des clients pour le Select (mode global)
  availableSites?: string[]; // Liste des sites de travail disponibles
}

export function VehiclesManagement({
  clientId,
  mode = 'global',
  initialVehicles,
  availableClients = [],
  availableSites = []
}: VehiclesManagementProps) {
  const router = useRouter();
  const { toast } = useToast();

  // États
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles || []);
  const [loading, setLoading] = useState(!initialVehicles);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // États pour filtres avancés
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // États pour le dialog d'édition/création
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    license_plate: '',
    make: '',
    model: '',
    year: '',
    vehicle_category: '',
    work_site: '',
    client_id: clientId || '',
  });

  // Extraire valeurs uniques pour les filtres (depuis les véhicules existants)
  const uniqueClients = useMemo(() => {
    const clients = vehicles
      .map(v => v.client?.name)
      .filter((name): name is string => !!name);
    return Array.from(new Set(clients)).sort();
  }, [vehicles]);

  const uniqueSites = useMemo(() => {
    const sites = vehicles
      .map(v => v.work_site)
      .filter((site): site is string => !!site);
    return Array.from(new Set(sites)).sort();
  }, [vehicles]);

  const uniqueCategories = useMemo(() => {
    const categories = vehicles
      .map(v => v.vehicle_category)
      .filter((cat): cat is string => !!cat);
    return Array.from(new Set(categories)).sort();
  }, [vehicles]);

  const uniqueYears = useMemo(() => {
    const years = vehicles
      .map(v => v.year?.toString())
      .filter((year): year is string => !!year);
    return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
  }, [vehicles]);

  // Filtrage personnalisé
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    // Filtre global
    if (globalFilter) {
      const searchLower = globalFilter.toLowerCase();
      filtered = filtered.filter(v =>
        v.license_plate.toLowerCase().includes(searchLower) ||
        v.make?.toLowerCase().includes(searchLower) ||
        v.model?.toLowerCase().includes(searchLower) ||
        v.client?.name.toLowerCase().includes(searchLower)
      );
    }

    // Filtres par facettes
    if (selectedClients.length > 0) {
      filtered = filtered.filter(v =>
        v.client?.name && selectedClients.includes(v.client.name)
      );
    }
    if (selectedSites.length > 0) {
      filtered = filtered.filter(v =>
        v.work_site && selectedSites.includes(v.work_site)
      );
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(v =>
        v.vehicle_category && selectedCategories.includes(v.vehicle_category)
      );
    }
    if (selectedYears.length > 0) {
      filtered = filtered.filter(v =>
        v.year && selectedYears.includes(v.year.toString())
      );
    }

    return filtered;
  }, [vehicles, globalFilter, selectedClients, selectedSites, selectedCategories, selectedYears]);

  // Compter les filtres actifs
  const activeFiltersCount =
    selectedClients.length +
    selectedSites.length +
    selectedCategories.length +
    selectedYears.length;

  // Réinitialiser tous les filtres
  const clearAllFilters = () => {
    setGlobalFilter('');
    setSelectedClients([]);
    setSelectedSites([]);
    setSelectedCategories([]);
    setSelectedYears([]);
  };

  // Colonnes
  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'license_plate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Immatriculation
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono font-semibold">{row.getValue('license_plate')}</span>
      ),
    },
    {
      accessorKey: 'make',
      header: 'Marque',
    },
    {
      accessorKey: 'model',
      header: 'Modèle',
    },
    {
      accessorKey: 'year',
      header: 'Année',
    },
    {
      accessorKey: 'vehicle_category',
      header: 'Catégorie',
      cell: ({ row }) => {
        const category = row.getValue('vehicle_category') as string | null;
        return category ? <Badge variant="outline">{category}</Badge> : '-';
      },
    },
    {
      accessorKey: 'work_site',
      header: 'Site',
      cell: ({ row }) => {
        const site = row.getValue('work_site') as string | null;
        return site ? (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            {site}
          </div>
        ) : (
          '-'
        );
      },
    },
  ];

  // Ajouter colonne client seulement en mode global
  if (mode === 'global') {
    columns.push({
      accessorKey: 'client',
      header: 'Client',
      cell: ({ row }) => {
        const client = row.getValue('client') as { name: string } | null;
        return client?.name || '-';
      },
    });
  }

  // Colonne actions
  columns.push({
    id: 'actions',
    cell: ({ row }) => {
      const vehicle = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(vehicle)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(vehicle)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      );
    },
  });

  const table = useReactTable({
    data: filteredVehicles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  // Synchroniser l'état local avec les props initialVehicles
  useEffect(() => {
    if (initialVehicles) {
      setVehicles(initialVehicles);
      setLoading(false);
    }
  }, [initialVehicles]);

  // Charger les véhicules (seulement si pas fournis en props)
  useEffect(() => {
    if (!initialVehicles) {
      fetchVehicles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]); // Only refetch when clientId changes

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const url = clientId
        ? `/api/vehicles?client_id=${clientId}`
        : '/api/vehicles';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les véhicules',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingVehicle(null);
    setFormData({
      license_plate: '',
      make: '',
      model: '',
      year: '',
      vehicle_category: '',
      work_site: '',
      client_id: clientId || '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      license_plate: vehicle.license_plate,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year?.toString() || '',
      vehicle_category: vehicle.vehicle_category || '',
      work_site: vehicle.work_site || '',
      client_id: vehicle.client?.id || clientId || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingVehicle
        ? `/api/vehicles/${editingVehicle.id}`
        : '/api/vehicles';

      const method = editingVehicle ? 'PATCH' : 'POST';

      // Adapter le format pour l'API existante (camelCase)
      const payload = editingVehicle ? {
        // PATCH: garder le format snake_case
        license_plate: formData.license_plate,
        make: formData.make,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
        vehicle_category: formData.vehicle_category || null,
        work_site: formData.work_site || null,
        client_id: formData.client_id,
      } : {
        // POST: utiliser le format camelCase attendu par l'API existante
        clientId: formData.client_id,
        licensePlate: formData.license_plate,
        make: formData.make,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
        category: formData.vehicle_category || null,
        site: formData.work_site || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }

      toast({
        title: editingVehicle ? 'Véhicule modifié' : 'Véhicule créé',
        description: 'Les informations ont été enregistrées avec succès',
      });

      setDialogOpen(false);

      // Rafraîchir le Server Component pour obtenir les nouvelles données
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible d\'enregistrer le véhicule',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le véhicule ${vehicle.license_plate} ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast({
        title: 'Véhicule supprimé',
        description: `Le véhicule ${vehicle.license_plate} a été supprimé`,
      });

      // Update optimiste : retirer le véhicule de l'état local
      setVehicles(prev => prev.filter(v => v.id !== vehicle.id));

      // Rafraîchir le Server Component en arrière-plan
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le véhicule',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Composant de filtre réutilisable
  const FilterPopover = ({
    title,
    icon: Icon,
    options,
    selected,
    onToggle
  }: {
    title: string;
    icon: any;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <Icon className="mr-2 h-4 w-4" />
          {title}
          {selected.length > 0 && (
            <>
              <div className="ml-2 h-4 w-px bg-border" />
              <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                {selected.length}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="max-h-[300px] overflow-auto">
          <div className="p-2">
            {options.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Aucune option
              </div>
            ) : (
              options.map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                  onClick={() => onToggle(option)}
                >
                  <Checkbox
                    checked={selected.includes(option)}
                    onCheckedChange={() => onToggle(option)}
                  />
                  <span className="flex-1 text-sm">{option}</span>
                  <span className="text-xs text-muted-foreground">
                    ({vehicles.filter(v => {
                      if (title === 'Client') return v.client?.name === option;
                      if (title === 'Site') return v.work_site === option;
                      if (title === 'Catégorie') return v.vehicle_category === option;
                      if (title === 'Année') return v.year?.toString() === option;
                      return false;
                    }).length})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar avec filtres modernes */}
        <div className="flex flex-col gap-4">
          {/* Ligne 1: Recherche et Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher immatriculation, marque, modèle..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-8"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGlobalFilter('')}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau véhicule
            </Button>
          </div>

          {/* Ligne 2: Filtres par facettes */}
          <div className="flex items-center gap-2">
            {mode === 'global' && (
              <FilterPopover
                title="Client"
                icon={Building2}
                options={uniqueClients}
                selected={selectedClients}
                onToggle={(value) => {
                  setSelectedClients(prev =>
                    prev.includes(value)
                      ? prev.filter(v => v !== value)
                      : [...prev, value]
                  );
                }}
              />
            )}
            <FilterPopover
              title="Site"
              icon={MapPin}
              options={uniqueSites}
              selected={selectedSites}
              onToggle={(value) => {
                setSelectedSites(prev =>
                  prev.includes(value)
                    ? prev.filter(v => v !== value)
                    : [...prev, value]
                );
              }}
            />
            <FilterPopover
              title="Catégorie"
              icon={Tags}
              options={uniqueCategories}
              selected={selectedCategories}
              onToggle={(value) => {
                setSelectedCategories(prev =>
                  prev.includes(value)
                    ? prev.filter(v => v !== value)
                    : [...prev, value]
                );
              }}
            />
            <FilterPopover
              title="Année"
              icon={Calendar}
              options={uniqueYears}
              selected={selectedYears}
              onToggle={(value) => {
                setSelectedYears(prev =>
                  prev.includes(value)
                    ? prev.filter(v => v !== value)
                    : [...prev, value]
                );
              }}
            />
            {(activeFiltersCount > 0 || globalFilter) && (
              <>
                <div className="h-4 w-px bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 px-2 lg:px-3"
                >
                  Effacer
                  <X className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Badges des filtres actifs */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedClients.map(client => (
                <Badge key={client} variant="secondary" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {client}
                  <button
                    onClick={() => setSelectedClients(prev => prev.filter(c => c !== client))}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedSites.map(site => (
                <Badge key={site} variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {site}
                  <button
                    onClick={() => setSelectedSites(prev => prev.filter(s => s !== site))}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="gap-1">
                  <Tags className="h-3 w-3" />
                  {cat}
                  <button
                    onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedYears.map(year => (
                <Badge key={year} variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {year}
                  <button
                    onClick={() => setSelectedYears(prev => prev.filter(y => y !== year))}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Truck className="h-16 w-16 opacity-20" />
                      {vehicles.length === 0 ? (
                        <>
                          <div className="space-y-1">
                            <p className="text-lg font-medium">Aucun véhicule</p>
                            <p className="text-sm text-muted-foreground">
                              Commencez par ajouter votre premier véhicule
                            </p>
                          </div>
                          <Button onClick={handleAdd} size="sm" className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un véhicule
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <p className="text-lg font-medium">Aucun résultat</p>
                            <p className="text-sm text-muted-foreground">
                              Aucun véhicule ne correspond à vos critères de recherche
                            </p>
                          </div>
                          <Button
                            onClick={clearAllFilters}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Effacer les filtres
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination et résultats */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredVehicles.length === vehicles.length ? (
              <span>{vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''}</span>
            ) : (
              <span>
                {filteredVehicles.length} sur {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Créer/Modifier */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? 'Modifier les informations du véhicule'
                : 'Ajouter un nouveau véhicule à la flotte'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="license_plate">
                Immatriculation *
              </Label>
              <Input
                id="license_plate"
                placeholder="AA-123-BB"
                value={formData.license_plate}
                onChange={(e) =>
                  setFormData({ ...formData, license_plate: e.target.value })
                }
                required
              />
            </div>

            {/* Sélecteur de client (seulement en mode global) */}
            {mode === 'global' && (
              <div className="grid gap-2">
                <Label htmlFor="client">
                  Client *
                </Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client_id: value })
                  }
                  required
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="make">Marque *</Label>
                <Input
                  id="make"
                  placeholder="Renault"
                  value={formData.make}
                  onChange={(e) =>
                    setFormData({ ...formData, make: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">Modèle</Label>
                <Input
                  id="model"
                  placeholder="Master"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Année</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2024"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="vehicle_category">Catégorie</Label>
                <Select
                  value={formData.vehicle_category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicle_category: value })
                  }
                >
                  <SelectTrigger id="vehicle_category">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tracteur">Tracteur</SelectItem>
                    <SelectItem value="porteur">Porteur</SelectItem>
                    <SelectItem value="remorque">Remorque</SelectItem>
                    <SelectItem value="ensemble_complet">Ensemble complet</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="work_site">Site de travail</Label>
              <Select
                value={formData.work_site}
                onValueChange={(value) =>
                  setFormData({ ...formData, work_site: value })
                }
              >
                <SelectTrigger id="work_site">
                  <SelectValue placeholder="Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {availableSites.map((site) => (
                    <SelectItem key={site} value={site}>
                      {site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingVehicle ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
