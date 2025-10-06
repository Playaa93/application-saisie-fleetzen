'use client';

import { useState, useMemo, Fragment } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export type Intervention = {
  id: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
  notes?: string | null;
  metadata?: any;
  location_accuracy?: number | null;
  intervention_type: { name: string } | null;
  client: { name: string } | null;
  vehicle: { license_plate: string } | null;
  agent: { first_name: string; last_name: string; email?: string } | null;
};

interface InterventionsDataTableProps {
  data: Intervention[];
  mode?: 'admin' | 'client';
}

export function InterventionsDataTable({ data, mode = 'admin' }: InterventionsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(10);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Lightbox state (unified for both modes)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxSlides, setLightboxSlides] = useState<Array<{ src: string; alt: string }>>([]);

  // Filtrer les données par statut
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter(item => item.status === statusFilter);
  }, [data, statusFilter]);

  // Compteurs pour les Tabs
  const { allCount, completedCount, inProgressCount, cancelledCount } = useMemo(() => {
    return {
      allCount: data.length,
      completedCount: data.filter(i => i.status === 'completed').length,
      inProgressCount: data.filter(i => i.status === 'in_progress').length,
      cancelledCount: data.filter(i => i.status === 'cancelled').length,
    };
  }, [data]);


  const openLightbox = (photos: Array<{ url: string }>, initialIndex: number, label: string) => {
    const slides = photos.map((photo, idx) => ({
      src: photo.url,
      alt: `${label} ${idx + 1}`,
    }));
    setLightboxSlides(slides);
    setLightboxIndex(initialIndex);
    setLightboxOpen(true);
  };

  const columns: ColumnDef<Intervention>[] = useMemo(() => {
    const baseColumns: ColumnDef<Intervention>[] = [
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.original.completed_at || row.original.created_at;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {format(new Date(date), 'dd/MM/yyyy', { locale: fr })}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(date), 'HH:mm', { locale: fr })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'intervention_type.name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.intervention_type?.name || 'Inconnu',
    },
    {
      accessorKey: 'client.name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Client
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const client = row.original.client?.name || 'Inconnu';
        const site = row.original.metadata?.site;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{client}</span>
            {site && <span className="text-xs text-muted-foreground">{site}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'vehicle.license_plate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Véhicule
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const vehicle = row.original.vehicle;
        if (!vehicle) return 'Inconnu';
        return <span className="font-medium">{vehicle.license_plate}</span>;
      },
    },
    {
      accessorKey: 'agent',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Agent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const agent = row.original.agent;
        return agent ? `${agent.first_name} ${agent.last_name}` : 'Inconnu';
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Statut
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusConfig = {
          completed: { label: 'Terminée', class: 'bg-green-100 text-green-800' },
          in_progress: { label: 'En cours', class: 'bg-blue-100 text-blue-800' },
          pending: { label: 'En attente', class: 'bg-gray-100 text-gray-800' },
          cancelled: { label: 'Annulée', class: 'bg-red-100 text-red-800' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || {
          label: status,
          class: 'bg-gray-100 text-gray-800',
        };

        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${config.class}`}>
            {config.label}
          </span>
        );
      },
    },
      // Colonne expand toggle (unified for both modes)
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }: any) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            className="p-0 h-8 w-8"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                row.getIsExpanded() ? 'rotate-180' : ''
              }`}
            />
          </Button>
        ),
      },
    ];

    return baseColumns;
  }, [mode]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
      expanded,
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater(table.getState().pagination);
        setPageSize(newState.pageSize);
      }
    },
  });

  return (
    <div className="space-y-4">
      {/* Filtres par statut avec Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">
            Toutes ({allCount})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Terminées ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            En cours ({inProgressCount})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Annulées ({cancelledCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sélecteur de taille de page */}
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => setPageSize(Number(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lignes par page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 lignes</SelectItem>
            <SelectItem value="25">25 lignes</SelectItem>
            <SelectItem value="50">50 lignes</SelectItem>
            <SelectItem value="100">100 lignes</SelectItem>
          </SelectContent>
        </Select>
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
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => row.toggleExpanded()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow key={`${row.id}-expanded`}>
                      <TableCell colSpan={columns.length} className="p-0">
                        <ExpandedPhotosView
                          intervention={row.original}
                          onPhotoClick={openLightbox}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucune intervention trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Affichage{' '}
          {table.getState().pagination.pageIndex * pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          sur {table.getFilteredRowModel().rows.length} intervention(s)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            Première
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <div className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} sur{' '}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            Dernière
          </Button>
        </div>
      </div>

      {/* Lightbox (unified for both modes) */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
        controller={{ closeOnBackdropClick: true }}
      />
    </div>
  );
}

// Composant pour afficher les photos expandées (unified for both modes)
interface ExpandedPhotosViewProps {
  intervention: Intervention;
  onPhotoClick: (photos: Array<{ url: string }>, index: number, label: string) => void;
}

function ExpandedPhotosView({ intervention, onPhotoClick }: ExpandedPhotosViewProps) {
  const photosAvant = intervention.metadata?.photos?.photosAvant || [];
  const photosApres = intervention.metadata?.photos?.photosApres || [];

  if (photosAvant.length === 0 && photosApres.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Aucune photo disponible pour cette intervention
      </div>
    );
  }

  // Composant grille uniforme pour une section de photos
  const PhotoSection = ({
    photos,
    label,
    badgeColor
  }: {
    photos: Array<{ url: string }>,
    label: string,
    badgeColor: string
  }) => {
    if (photos.length === 0) return null;

    return (
      <div className="space-y-3">
        <Badge className={`${badgeColor}`}>
          {label} ({photos.length})
        </Badge>

        {/* Grille uniforme responsive - style Polaroid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo: { url: string }, index: number) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-3 pb-2"
            >
              {/* Photo - clic ouvre la lightbox */}
              <div
                className="relative aspect-square rounded overflow-hidden mb-3 bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onPhotoClick(photos, index, label)}
              >
                <img
                  src={photo.url}
                  alt={`${label} ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Bouton Voir - ouvre dans nouvel onglet */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(photo.url, '_blank', 'noopener,noreferrer');
                }}
              >
                Voir
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-muted/20 p-6 border-t">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section AVANT */}
        <PhotoSection
          photos={photosAvant}
          label="PHOTO AVANT"
          badgeColor="bg-blue-500 hover:bg-blue-600"
        />

        {/* Section APRÈS */}
        <PhotoSection
          photos={photosApres}
          label="PHOTO APRÈS"
          badgeColor="bg-green-500 hover:bg-green-600"
        />
      </div>
    </div>
  );
}
