'use client';

import { useState, useEffect } from 'react';
import { errorLogger, type ErrorLog } from '@/lib/errorLogger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const allLogs = errorLogger.getLogs();
    setLogs(allLogs);
  };

  const clearAllLogs = () => {
    if (confirm('Effacer tous les logs ?')) {
      errorLogger.clearLogs();
      setLogs([]);
    }
  };

  const exportLogs = () => {
    errorLogger.exportLogs();
  };

  const getTypeBadgeVariant = (type: ErrorLog['type']) => {
    switch (type) {
      case 'api_error':
        return 'destructive';
      case 'validation_error':
        return 'secondary';
      case 'network_error':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex-1 p-4 space-y-4 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Logs de Débogage</h1>
        <div className="flex gap-2">
          <Button onClick={loadLogs} variant="outline" size="sm">
            🔄 Rafraîchir
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm">
            📥 Exporter
          </Button>
          <Button onClick={clearAllLogs} variant="destructive" size="sm">
            🗑️ Effacer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
          <CardDescription>Résumé des erreurs enregistrées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{logs.length}</p>
              <p className="text-sm text-muted-foreground">Total logs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">
                {logs.filter(l => l.type === 'api_error').length}
              </p>
              <p className="text-sm text-muted-foreground">Erreurs API</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun log enregistré
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.reverse().map((log, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={getTypeBadgeVariant(log.type)}>
                    {log.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{log.message}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {log.url && (
                  <div>
                    <strong>URL:</strong> <code className="text-xs">{log.url}</code>
                  </div>
                )}
                {log.statusCode && (
                  <div>
                    <strong>Status:</strong> {log.statusCode}
                  </div>
                )}
                {log.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">
                      Détails
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    User-Agent
                  </summary>
                  <p className="mt-1 text-xs text-muted-foreground break-all">
                    {log.userAgent}
                  </p>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
