'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Clock, User, FileText, Search, Filter } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  details: string;
  status: 'success' | 'warning' | 'error';
}

// Mock data - remplacer par vraies données de la DB
const mockLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2025-10-06 14:23:15',
    user: 'admin@fleetzen.com',
    action: 'CREATE',
    entity: 'Vehicle',
    details: 'Création du véhicule AB-123-CD',
    status: 'success',
  },
  {
    id: '2',
    timestamp: '2025-10-06 14:18:42',
    user: 'agent@fleetzen.com',
    action: 'UPDATE',
    entity: 'Intervention',
    details: 'Modification intervention #1234',
    status: 'success',
  },
  {
    id: '3',
    timestamp: '2025-10-06 14:10:28',
    user: 'admin@fleetzen.com',
    action: 'DELETE',
    entity: 'Client',
    details: 'Tentative de suppression client (refusée)',
    status: 'error',
  },
  {
    id: '4',
    timestamp: '2025-10-06 13:55:11',
    user: 'agent@fleetzen.com',
    action: 'LOGIN',
    entity: 'Auth',
    details: 'Connexion réussie depuis 192.168.1.10',
    status: 'success',
  },
  {
    id: '5',
    timestamp: '2025-10-06 13:42:33',
    user: 'admin@fleetzen.com',
    action: 'UPDATE',
    entity: 'Settings',
    details: 'Modification des paramètres système',
    status: 'warning',
  },
];

export function SecurityTab() {
  const [logs, setLogs] = useState<AuditLog[]>(mockLogs);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les logs
  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesEntity = filterEntity === 'all' || log.entity === filterEntity;
    const matchesSearch =
      searchTerm === '' ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesAction && matchesEntity && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default">Succès</Badge>;
      case 'warning':
        return <Badge variant="secondary">Avertissement</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Logs d'Audit
              </CardTitle>
              <CardDescription>
                Historique des actions effectuées dans l'application
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="sr-only">
                Rechercher
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher par utilisateur ou détails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-[180px]">
              <Label htmlFor="filter-action" className="sr-only">
                Filtrer par action
              </Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger id="filter-action">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="LOGIN">LOGIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Label htmlFor="filter-entity" className="sr-only">
                Filtrer par entité
              </Label>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger id="filter-entity">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entités</SelectItem>
                  <SelectItem value="Vehicle">Vehicle</SelectItem>
                  <SelectItem value="Intervention">Intervention</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Settings">Settings</SelectItem>
                  <SelectItem value="Auth">Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tableau des logs */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Clock className="h-4 w-4 inline mr-2" />
                    Date/Heure
                  </TableHead>
                  <TableHead>
                    <User className="h-4 w-4 inline mr-2" />
                    Utilisateur
                  </TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucun log trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="text-sm">{log.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.entity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {log.details}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination placeholder */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Affichage de {filteredLogs.length} résultat(s)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Précédent
              </Button>
              <Button variant="outline" size="sm" disabled>
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">À propos des logs d'audit</p>
              <p className="text-sm text-muted-foreground">
                Les logs d'audit sont conservés pendant 90 jours. Toutes les actions sensibles
                (création, modification, suppression) sont automatiquement enregistrées avec
                l'identité de l'utilisateur, la date/heure, et les détails de l'action.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
