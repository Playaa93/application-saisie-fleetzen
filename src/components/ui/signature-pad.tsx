'use client';

import * as React from 'react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignaturePadComponentProps {
  onSignatureChange?: (signature: string | null) => void;
  className?: string;
  label?: string;
  required?: boolean;
  width?: number;
  height?: number;
}

export function SignaturePadComponent({
  onSignatureChange,
  className,
  label,
  required = false,
  width = 500,
  height = 200,
}: SignaturePadComponentProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const signaturePadRef = React.useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = React.useState(true);

  React.useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize SignaturePad
    signaturePadRef.current = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 3,
      throttle: 16, // 60fps
    });

    // Set canvas size
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.getContext('2d')?.scale(ratio, ratio);

    // Listen to signature changes
    const handleEnd = () => {
      if (signaturePadRef.current) {
        const isCurrentlyEmpty = signaturePadRef.current.isEmpty();
        setIsEmpty(isCurrentlyEmpty);

        if (!isCurrentlyEmpty) {
          const dataUrl = signaturePadRef.current.toDataURL('image/png');
          onSignatureChange?.(dataUrl);
        } else {
          onSignatureChange?.(null);
        }
      }
    };

    signaturePadRef.current.addEventListener('endStroke', handleEnd);

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, [width, height, onSignatureChange]);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
      onSignatureChange?.(null);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative border-2 border-border rounded-lg bg-white dark:bg-white">
        <canvas
          ref={canvasRef}
          className="rounded-lg touch-none"
          style={{ width: `${width}px`, height: `${height}px` }}
        />

        {/* Clear button overlay */}
        <div className="absolute top-2 right-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleClear}
            disabled={isEmpty}
            className="bg-white/90 backdrop-blur-sm"
          >
            <Eraser className="h-4 w-4 mr-2" />
            Effacer
          </Button>
        </div>

        {/* Empty state hint */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground">
              Signez ici avec votre doigt ou stylet
            </p>
          </div>
        )}
      </div>

      {required && isEmpty && (
        <p className="text-xs text-destructive">
          La signature est obligatoire
        </p>
      )}
    </div>
  );
}

// Export helper to get signature from ref
export const getSignatureData = (
  signaturePad: SignaturePad | null
): string | null => {
  if (!signaturePad || signaturePad.isEmpty()) {
    return null;
  }
  return signaturePad.toDataURL('image/png');
};
