// Web Notifications & Vibration service for workout timer

class NotificationService {
  private hasPermission = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  // Request user permission for notifications
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }
    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        this.hasPermission = permission === 'granted';
        return this.hasPermission;
      } catch {
        return false;
      }
    }
    return false;
  }

  // Send a native browser notification when timer is done
  sendTimerCompletedNotification(title = '⏱️ Temps de repos terminé !', body = 'C\'est l\'heure de la série suivante. Donnez tout !') {
    if (typeof window === 'undefined') return;

    // Trigger vibration immediately
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 500]);
      } catch {
        // Ignore
      }
    }

    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const options: NotificationOptions & { renotify?: boolean } = {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: 'ppl-timer-done',
          renotify: true,
          requireInteraction: false
        };
        const notif = new Notification(title, options as NotificationOptions);

        // Focus window when notification is clicked
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch {
        // Notification constructor may fail on some mobile platforms
      }
    }
  }
}

export const notificationService = new NotificationService();
