// Gym Tracker Service Worker
// Handles background rest-timer notifications for iOS/Android lock screen

const TIMER_TAG = "gym-rest-timer";
let restTimeout = null;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the app
self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  if (type === "START_REST_TIMER") {
    // Cancel any existing timer
    if (restTimeout) clearTimeout(restTimeout);

    const { seconds, nextExercise } = payload;

    // Show "resting" notification immediately so it appears on the lock screen
    const restBody = nextExercise
      ? `${seconds}s rest — Next: ${nextExercise.name} (Set ${nextExercise.setNumber}/${nextExercise.totalSets})`
      : `${seconds}s rest`;

    self.registration.showNotification("Resting...", {
      body: restBody,
      tag: TIMER_TAG,
      silent: true,
      requireInteraction: false,
    });

    // Schedule the "rest complete" notification
    restTimeout = setTimeout(() => {
      const doneBody = nextExercise
        ? `Time to lift! ${nextExercise.name} — ${nextExercise.weight} × ${nextExercise.reps}`
        : "Time to lift!";

      self.registration.showNotification("Rest Complete", {
        body: doneBody,
        tag: TIMER_TAG,
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
      });
      restTimeout = null;
    }, seconds * 1000);
  }

  if (type === "CANCEL_REST_TIMER") {
    if (restTimeout) {
      clearTimeout(restTimeout);
      restTimeout = null;
    }
    // Dismiss the resting notification
    self.registration.getNotifications({ tag: TIMER_TAG }).then((notifications) => {
      notifications.forEach((n) => n.close());
    });
  }

  if (type === "SHOW_NOTIFICATION") {
    const { title, body } = payload;
    self.registration.showNotification(title, {
      body,
      tag: TIMER_TAG,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
    });
  }
});

// When user taps the notification, focus/open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow("/");
    })
  );
});
