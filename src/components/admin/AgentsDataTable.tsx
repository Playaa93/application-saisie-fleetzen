'use client';

import { useState, useMemo } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpDown, Search, Plus, Pencil, Trash2, RotateCcw, User } from 'lucide-react';
import { AgentFormDialog } from './AgentFormDialog';
import { AgentDeleteDialog } from './AgentDeleteDialog';

export type Agent = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role?: string | null;
  user_type: 'field_agent' | 'admin' | 'super_admin';
  is_active: boolean;
  avatar_url?: string | null;
  created_at: string;
  permanently_deleted?: boolean;
};

const getUserTypeBadge = (userType: string) => {
  switch (userType) {
    case 'super_admin':
      return <Badge variant="destructive">Super Admin</Badge>;
    case 'admin':
      return <Badge variant="default">Admin</Badge>;
    case 'field_agent':
      return <Badge variant="secondary">Agent Terrain</Badge>;
    default:
      return <Badge variant="outline">{userType}</Badge>;
  }
};

interface AgentsDataTableProps {
  data: Agent[];
}

export function AgentsDataTable({ data }: AgentsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditDialogOpen(true);
  };

  const handleDelete = (agent: Agent) => {
    setSelectedAgent(agent);
    setDeleteDialogOpen(true);
  };

  // Mémoriser les données filtrées pour éviter les recalculs
  const filteredData = useMemo(() => {
    return data
      .filter(agent => !agent.permanently_deleted) // Toujours exclure les agents supprimés définitivement
      .filter(agent => {
        if (statusFilter === 'active') return agent.is_active;
        if (statusFilter === 'inactive') return !agent.is_active;
        return true; // 'all'
      });
  }, [data, statusFilter]);

  // Mémoriser les compteurs pour éviter les recalculs
  const { activeCount, inactiveCount, totalCount } = useMemo(() => {
    return {
      activeCount: data.filter(a => !a.permanently_deleted && a.is_active).length,
      inactiveCount: data.filter(a => !a.permanently_deleted && !a.is_active).length,
      totalCount: data.filter(a => !a.permanently_deleted).length,
    };
  }, [data]);

  const columns: ColumnDef<Agent>[] = [
    {
      id: 'avatar',
      header: '',
      cell: ({ row }) => {
        const agent = row.original;
        const initials = `${agent.first_name.charAt(0)}${agent.last_name.charAt(0)}`;

        // Si l'agent a une photo, afficher l'image directement
        if (agent.avatar_url) {
          return (
            <div className="h-8 w-8 rounded-full overflow-hidden border border-border">
              <img
                src={agent.avatar_url}
                alt={`${agent.first_name} ${agent.last_name}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.error('Avatar load error:', agent.avatar_url);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          );
        }

        // Sinon afficher l'icône User
        return (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        );
      },
    },
    {
      accessorKey: 'first_name',
      header: 'Prénom',
    },
    {
      accessorKey: 'last_name',
      header: 'Nom',
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Téléphone',
      cell: ({ row }) => row.getValue('phone') || '-',
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ row }) => row.getValue('role') || '-',
    },
    {
      accessorKey: 'user_type',
      header: 'Type',
      cell: ({ row }) => getUserTypeBadge(row.getValue('user_type')),
    },
    {
      accessorKey: 'is_active',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
          {row.getValue('is_active') ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date création
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(agent)}
              title="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(agent)}
              title={agent.is_active ? 'Désactiver' : 'Réactiver'}
            >
              {agent.is_active ? (
                <Trash2 className="h-4 w-4 text-destructive" />
              ) : (
                <RotateCcw className="h-4 w-4 text-green-600" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <>
      <div className="space-y-4">
        {/* Filtres par statut */}
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'active' | 'inactive' | 'all')}>
          <TabsList>
            <TabsTrigger value="active">
              Actifs ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactifs ({inactiveCount})
            </TabsTrigger>
            <TabsTrigger value="all">
              Tous ({totalCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un agent..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel agent
          </Button>
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
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Aucun agent trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} agent(s)
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

      {/* Dialogs */}
      <AgentFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
      />

      <AgentFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        agent={selectedAgent}
        mode="edit"
      />

      <AgentDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        agent={selectedAgent}
      />
    </>
  );
}
