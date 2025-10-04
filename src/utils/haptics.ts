/**
 * Haptic Feedback Utility for Mobile PWA
 * Provides tactile feedback for user actions
 */

import { isHapticEnabled } from '@/hooks/useHapticPreference'

export enum HapticPattern {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
}

/**
 * Trigger haptic feedback if supported by device
 * @param pattern - Type of haptic feedback to trigger
 */
export function triggerHaptic(pattern: HapticPattern = HapticPattern.LIGHT): void {
  // Check user preference first
  if (!isHapticEnabled()) {
    return;
  }

  // Check if vibration API is supported
  if (!('vibrate' in navigator)) {
    return;
  }

  try {
    switch (pattern) {
      case HapticPattern.SUCCESS:
        // Short single vibration for success
        navigator.vibrate(50);
        break;

      case HapticPattern.ERROR:
        // Double vibration pattern for errors
        navigator.vibrate([100, 50, 100]);
        break;

      case HapticPattern.WARNING:
        // Triple short vibration for warnings
        navigator.vibrate([50, 30, 50, 30, 50]);
        break;

      case HapticPattern.LIGHT:
        // Very short tap
        navigator.vibrate(25);
        break;

      case HapticPattern.MEDIUM:
        // Standard tap
        navigator.vibrate(50);
        break;

      case HapticPattern.HEAVY:
        // Strong tap
        navigator.vibrate(75);
        break;

      default:
        navigator.vibrate(50);
    }
  } catch (error) {
    // Silently fail if vibration is not supported or blocked
    console.debug('Haptic feedback not supported:', error);
  }
}

/**
 * Check if haptic feedback is supported on this device
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}
