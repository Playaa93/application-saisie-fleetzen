"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";

export function AdminMobileToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminView, setIsAdminView] = useState(true);

  useEffect(() => {
    setIsAdminView(pathname.startsWith("/admin"));
  }, [pathname]);

  const handleChange = (checked: boolean) => {
    setIsAdminView(checked);

    if (checked) {
      if (!pathname.startsWith("/admin")) {
        router.push("/admin");
      }
      return;
    }

    router.push("/");
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col text-right">
        <span className="text-xs text-muted-foreground leading-none">Basculer</span>
        <span className="text-sm font-medium leading-none">Mode admin</span>
      </div>
      <Switch
        checked={isAdminView}
        onCheckedChange={handleChange}
        aria-label="Basculer vers le mode agent"
      />
    </div>
  );
}
