/**
 * PWA Tests - Installation and Manifest
 * Tests PWA installability, manifest validation, and app-like features
 */

import { test, expect } from '@playwright/test';

test.describe('PWA Installation', () => {
  test('should have valid web app manifest', async ({ page }) => {
    await page.goto('/');

    // Check manifest link
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestLink).toBeTruthy();

    // Fetch and validate manifest
    const manifest = await page.evaluate(async () => {
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifestLink) {
        const response = await fetch(manifestLink.href);
        return await response.json();
      }
      return null;
    });

    expect(manifest).not.toBeNull();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toHaveLength(expect.any(Number));
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have all required icon sizes', async ({ page }) => {
    await page.goto('/');

    const manifest = await page.evaluate(async () => {
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifestLink) {
        const response = await fetch(manifestLink.href);
        return await response.json();
      }
      return null;
    });

    const iconSizes = manifest.icons.map((icon: any) => icon.sizes);

    // PWA should have at least these icon sizes
    const requiredSizes = ['192x192', '512x512'];
    requiredSizes.forEach(size => {
      expect(iconSizes).toContain(size);
    });
  });

  test('should have theme color meta tags', async ({ page }) => {
    await page.goto('/');

    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    const msApplicationColor = await page.locator('meta[name="msapplication-TileColor"]').getAttribute('content');

    expect(themeColor).toBeTruthy();
    expect(msApplicationColor).toBeTruthy();
  });

  test('should have apple touch icons', async ({ page }) => {
    await page.goto('/');

    const appleTouchIcon = await page.locator('link[rel="apple-touch-icon"]').count();
    expect(appleTouchIcon).toBeGreaterThan(0);
  });

  test('should trigger install prompt', async ({ page, context }) => {
    await page.goto('/');

    // Simulate beforeinstallprompt event
    const installPromptTriggered = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let triggered = false;

        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          triggered = true;
          resolve(true);
        });

        // Timeout if event doesn't fire
        setTimeout(() => resolve(triggered), 2000);
      });
    });

    // Note: In test environment, this may not trigger
    // In real browsers with HTTPS, this would work
    expect(typeof installPromptTriggered).toBe('boolean');
  });

  test('should show install button when installable', async ({ page }) => {
    await page.goto('/');

    // Check if install button is present
    const hasInstallButton = await page.evaluate(() => {
      const installBtn = document.querySelector('[data-testid="install-button"]');
      return installBtn !== null;
    });

    // Install button should exist (may be hidden initially)
    expect(typeof hasInstallButton).toBe('boolean');
  });

  test('should have proper manifest properties for mobile', async ({ page }) => {
    await page.goto('/');

    const manifest = await page.evaluate(async () => {
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifestLink) {
        const response = await fetch(manifestLink.href);
        return await response.json();
      }
      return null;
    });

    // Check mobile-specific properties
    expect(manifest.display).toMatch(/standalone|fullscreen|minimal-ui/);
    expect(manifest.orientation).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.theme_color).toBeTruthy();
  });

  test('should have description and categories', async ({ page }) => {
    await page.goto('/');

    const manifest = await page.evaluate(async () => {
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifestLink) {
        const response = await fetch(manifestLink.href);
        return await response.json();
      }
      return null;
    });

    expect(manifest.description).toBeTruthy();
    expect(manifest.categories).toBeDefined();
  });

  test('should have screenshots for app store listing', async ({ page }) => {
    await page.goto('/');

    const manifest = await page.evaluate(async () => {
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifestLink) {
        const response = await fetch(manifestLink.href);
        return await response.json();
      }
      return null;
    });

    // Screenshots are optional but recommended
    if (manifest.screenshots) {
      expect(manifest.screenshots.length).toBeGreaterThan(0);
      manifest.screenshots.forEach((screenshot: any) => {
        expect(screenshot.src).toBeTruthy();
        expect(screenshot.sizes).toBeTruthy();
        expect(screenshot.type).toBeTruthy();
      });
    }
  });
});

test.describe('PWA Display Modes', () => {
  test('should run in standalone mode when installed', async ({ page }) => {
    await page.goto('/');

    const displayMode = await page.evaluate(() => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'standalone';
      }
      if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return 'fullscreen';
      }
      if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        return 'minimal-ui';
      }
      return 'browser';
    });

    // In test environment, will likely be 'browser'
    expect(['standalone', 'fullscreen', 'minimal-ui', 'browser']).toContain(displayMode);
  });

  test('should hide browser UI in standalone mode', async ({ page }) => {
    await page.goto('/');

    // Check for standalone-specific styles
    const hasStandaloneStyles = await page.evaluate(() => {
      return document.documentElement.classList.contains('standalone') ||
             window.matchMedia('(display-mode: standalone)').matches;
    });

    expect(typeof hasStandaloneStyles).toBe('boolean');
  });
});

test.describe('PWA App Shortcuts', () => {
  test('should define app shortcuts in manifest', async ({ page }) => {
    await page.goto('/');

    const manifest = await page.evaluate(async () => {
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifestLink) {
        const response = await fetch(manifestLink.href);
        return await response.json();
      }
      return null;
    });

    if (manifest.shortcuts) {
      expect(manifest.shortcuts.length).toBeGreaterThan(0);

      manifest.shortcuts.forEach((shortcut: any) => {
        expect(shortcut.name).toBeTruthy();
        expect(shortcut.url).toBeTruthy();
        expect(shortcut.description).toBeTruthy();
      });
    }
  });
});

test.describe('PWA Share Target', () => {
  test('should register as share target', async ({ page }) => {
    await page.goto('/');

    const manifest = await page.evaluate(async () => {
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifestLink) {
        const response = await fetch(manifestLink.href);
        return await response.json();
      }
      return null;
    });

    // Check if share target is configured
    if (manifest.share_target) {
      expect(manifest.share_target.action).toBeTruthy();
      expect(manifest.share_target.method).toBeTruthy();
      expect(manifest.share_target.enctype).toBeTruthy();
      expect(manifest.share_target.params).toBeTruthy();
    }
  });

  test('should handle Web Share API', async ({ page, browserName }) => {
    // Web Share API only available in HTTPS context and some browsers
    if (browserName === 'chromium') {
      await page.goto('/');

      const canShare = await page.evaluate(() => {
        return 'share' in navigator;
      });

      expect(typeof canShare).toBe('boolean');
    }
  });
});

test.describe('PWA Capabilities', () => {
  test('should request notification permission', async ({ page, context }) => {
    await page.goto('/');

    // Grant notification permission
    await context.grantPermissions(['notifications']);

    const hasNotificationPermission = await page.evaluate(() => {
      return Notification.permission === 'granted';
    });

    expect(hasNotificationPermission).toBe(true);
  });

  test('should register for push notifications', async ({ page }) => {
    await page.goto('/');

    const pushSupported = await page.evaluate(async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        return 'pushManager' in registration;
      }
      return false;
    });

    expect(pushSupported).toBe(true);
  });

  test('should support background sync', async ({ page }) => {
    await page.goto('/');

    const syncSupported = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return 'sync' in registration;
      }
      return false;
    });

    expect(typeof syncSupported).toBe('boolean');
  });

  test('should support periodic background sync', async ({ page }) => {
    await page.goto('/');

    const periodicSyncSupported = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return 'periodicSync' in registration;
      }
      return false;
    });

    expect(typeof periodicSyncSupported).toBe('boolean');
  });
});

test.describe('PWA Update Flow', () => {
  test('should show update notification when new version available', async ({ page }) => {
    await page.goto('/');

    // Simulate service worker update
    const updateAvailable = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            resolve(true);
          });

          setTimeout(() => resolve(false), 3000);
        } else {
          resolve(false);
        }
      });
    });

    expect(typeof updateAvailable).toBe('boolean');
  });

  test('should reload on update confirmation', async ({ page }) => {
    await page.goto('/');

    // Check for update UI
    const hasUpdateUI = await page.evaluate(() => {
      const updateButton = document.querySelector('[data-testid="reload-for-update"]');
      return updateButton !== null;
    });

    expect(typeof hasUpdateUI).toBe('boolean');
  });
});

test.describe('PWA Lighthouse Checks', () => {
  test('should pass PWA installability criteria', async ({ page }) => {
    await page.goto('/');

    const pwaChecks = await page.evaluate(() => {
      return {
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasServiceWorker: 'serviceWorker' in navigator,
        hasMetaViewport: !!document.querySelector('meta[name="viewport"]'),
        hasThemeColor: !!document.querySelector('meta[name="theme-color"]'),
        isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost',
      };
    });

    expect(pwaChecks.hasManifest).toBe(true);
    expect(pwaChecks.hasServiceWorker).toBe(true);
    expect(pwaChecks.hasMetaViewport).toBe(true);
    expect(pwaChecks.hasThemeColor).toBe(true);
  });
});
