"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /profile → /profil
 * Unification pour utiliser uniquement la page avec API réelle
 */
export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profil");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Redirection vers votre profil...</p>
    </div>
  );
}
