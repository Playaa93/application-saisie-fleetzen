'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Hook to warn users about unsaved changes before navigation
 * Handles: page close/refresh, link clicks, back button
 * Compatible with Next.js 15 App Router (no router events)
 */
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  message: string = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?'
) {
  const pathname = usePathname();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const isNavigatingRef = useRef(false);

  // 1. Handle page close/refresh with beforeunload
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom message but still show dialog
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message]);

  // 2. Handle link clicks and intercept navigation
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleClick = (e: MouseEvent) => {
      // Check if target is a link or inside a link
      let target = e.target as HTMLElement;
      while (target && target !== document.body) {
        if (target.tagName === 'A') {
          const href = target.getAttribute('href');

          // Only intercept internal navigation
          if (href && href.startsWith('/') && href !== pathname && !isNavigatingRef.current) {
            e.preventDefault();
            e.stopPropagation();
            setPendingUrl(href);
            setShowDialog(true);
          }
          break;
        }
        target = target.parentElement as HTMLElement;
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsavedChanges, pathname]);

  // 3. Handle back button with popstate
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handlePopState = (e: PopStateEvent) => {
      if (!isNavigatingRef.current) {
        e.preventDefault();
        // Push state back to current page
        window.history.pushState(null, '', pathname);
        setShowDialog(true);
        setPendingUrl('back');
      }
    };

    // Push initial state to enable back button interception
    window.history.pushState(null, '', pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, pathname]);

  // Confirm navigation
  const confirmNavigation = useCallback(() => {
    isNavigatingRef.current = true;
    setShowDialog(false);

    if (pendingUrl === 'back') {
      window.history.back();
    } else if (pendingUrl) {
      router.push(pendingUrl);
    }

    setPendingUrl(null);
  }, [pendingUrl, router]);

  // Cancel navigation
  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingUrl(null);
  }, []);

  return {
    showDialog,
    confirmNavigation,
    cancelNavigation,
    message,
  };
}
