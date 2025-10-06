'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AppearanceTab() {
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode preference on mount
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem('darkMode', checked.toString());

    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    toast({
      title: checked ? 'Mode sombre activé' : 'Mode clair activé',
      description: 'Votre préférence a été enregistrée',
    });
  };

  return (
    <div className="space-y-6">
      {/* Dark Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Thème de l'Application
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'interface
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                {darkMode ? (
                  <Moon className="h-6 w-6 text-primary" />
                ) : (
                  <Sun className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <Label htmlFor="dark-mode" className="text-base font-medium cursor-pointer">
                  Mode Sombre
                </Label>
                <p className="text-sm text-muted-foreground">
                  Activer le thème sombre pour réduire la fatigue oculaire
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>

          {/* Preview */}
          <div className="p-4 border rounded-lg space-y-3">
            <p className="text-sm font-medium">Aperçu</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background border rounded-md">
                <div className="h-3 w-20 bg-foreground/80 rounded mb-2" />
                <div className="h-2 w-full bg-foreground/20 rounded mb-1" />
                <div className="h-2 w-3/4 bg-foreground/20 rounded" />
              </div>
              <div className="p-4 bg-primary text-primary-foreground rounded-md">
                <div className="h-3 w-20 bg-primary-foreground rounded mb-2" />
                <div className="h-2 w-full bg-primary-foreground/70 rounded mb-1" />
                <div className="h-2 w-3/4 bg-primary-foreground/70 rounded" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="text-sm">
              <strong>Note :</strong> Le thème est enregistré localement dans votre navigateur.
              Vous devrez réactiver cette option sur chaque appareil que vous utilisez.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Future: Color Themes */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Thèmes de Couleur
          </CardTitle>
          <CardDescription>
            Personnalisez les couleurs de l'interface (bientôt disponible)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-lg bg-blue-500 border-2 border-primary" />
            <div className="h-16 w-16 rounded-lg bg-green-500 opacity-50" />
            <div className="h-16 w-16 rounded-lg bg-purple-500 opacity-50" />
            <div className="h-16 w-16 rounded-lg bg-orange-500 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
