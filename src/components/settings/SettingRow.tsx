import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface SettingRowProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  children?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
}

export function SettingRow({
  icon: Icon,
  label,
  description,
  children,
  danger,
  onClick,
}: SettingRowProps) {
  const content = (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className={`h-5 w-5 flex-shrink-0 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${danger ? 'text-destructive' : ''}`}>{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="ml-4">{children}</div>}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left hover:bg-accent/50 px-4 -mx-4 rounded-lg transition-colors"
      >
        {content}
      </button>
    );
  }

  return <div className="px-4 -mx-4">{content}</div>;
}
