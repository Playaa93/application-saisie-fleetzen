import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { getStatusVariant } from '@/lib/dashboard-utils';

interface Intervention {
  id: string;
  status: string;
  created_at: string;
  intervention_type: { name: string } | null;
  client: { name: string } | null;
  vehicle: { license_plate: string } | null;
  agent: { first_name: string; last_name: string } | null;
}

interface RecentInterventionsTableProps {
  interventions: Intervention[];
}

export function RecentInterventionsTable({ interventions }: RecentInterventionsTableProps) {
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      completed: 'Complété',
      in_progress: 'En cours',
      pending: 'En attente',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Interventions Récentes</CardTitle>
            <CardDescription>
              Les 5 dernières interventions enregistrées
            </CardDescription>
          </div>
          <Link href="/admin/interventions">
            <Button variant="outline" size="sm">
              Voir tout
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interventions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucune intervention récente
                  </TableCell>
                </TableRow>
              ) : (
                interventions.map((intervention) => (
                  <TableRow key={intervention.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {intervention.intervention_type?.name || 'Inconnu'}
                    </TableCell>
                    <TableCell>{intervention.client?.name || 'N/A'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {intervention.vehicle?.license_plate || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {intervention.agent
                        ? `${intervention.agent.first_name} ${intervention.agent.last_name}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(intervention.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(intervention.status)}>
                        {getStatusLabel(intervention.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
