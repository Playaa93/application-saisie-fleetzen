"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, ArrowRight, ListTodo } from "lucide-react";

interface Task {
  id: string;
  type: string;
  status: string;
  scheduledAt?: string;
  client: string;
  vehicule: string;
}

interface TaskListProps {
  tasks: Task[];
}

/**
 * TaskList - Client Component (for interactivity)
 *
 * Receives pre-authenticated data from Server Component parent.
 * No useEffect, no fetch() = no 401 errors.
 *
 * @see src/app/page.tsx - Data fetched server-side via DAL
 */
export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            À faire maintenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ListTodo className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune intervention en cours
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Toutes vos interventions sont terminées 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          À faire maintenant
          <Badge variant="secondary" className="ml-2">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/interventions/${task.id}`}
              className="block p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{task.type}</p>
                    {task.status === "in_progress" ? (
                      <Badge variant="default" className="bg-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        En cours
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        En attente
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="truncate">
                      <span className="font-medium">Client:</span> {task.client}
                    </p>
                    <p className="truncate">
                      <span className="font-medium">Véhicule:</span> {task.vehicule}
                    </p>
                    {task.scheduledAt && (
                      <p className="text-primary font-medium">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(task.scheduledAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
