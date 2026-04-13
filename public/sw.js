// gymtracker_ Service Worker
// Handles background rest-timer notifications and app shell caching

const APP_VERSION = "1.0.0";
const CACHE_NAME = `gym-v${APP_VERSION}`;
const TIMER_TAG = "gym-rest-timer";
let restTimeout = null;

// App shell files to cache for instant/offline loading
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Clean up old version caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("gym-v") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
    .then(() => {
      // Notify all open clients about the new version
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SW_UPDATED", version: APP_VERSION });
        });
      });
    })
  );
});

// Network-first strategy: try network, fall back to cache for offline support
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only cache GET requests for same-origin navigation & static assets
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip API routes — always go to network
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for offline use
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, serve the cached home page as fallback
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});

// Listen for messages from the app
self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  if (type === "GET_VERSION") {
    event.source.postMessage({ type: "SW_VERSION", version: APP_VERSION });
    return;
  }

  if (type === "START_REST_TIMER") {
    // Cancel any existing timer
    if (restTimeout) clearTimeout(restTimeout);

    const { seconds, nextExercise } = payload;

    // Show "resting" notification only when app is not visible (backgrounded/locked)
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const anyVisible = clients.some((c) => c.visibilityState === "visible");
      if (anyVisible) return; // App is in foreground — skip lock-screen notification

      const restBody = nextExercise
        ? `${seconds}s rest — Next: ${nextExercise.name} (${nextExercise.setNumber === 0 ? "Warmup" : `Set ${nextExercise.setNumber}/${nextExercise.totalSets}`})`
        : `${seconds}s rest`;

      self.registration.showNotification("Resting...", {
        body: restBody,
        tag: TIMER_TAG,
        silent: true,
        requireInteraction: false,
      });
    });

    // Schedule the "rest complete" notification
    restTimeout = setTimeout(() => {
      const doneBody = nextExercise
        ? `Time to lift! ${nextExercise.name} — ${nextExercise.weight} × ${nextExercise.reps}`
        : "Time to lift!";

      // Only notify if app is not in foreground (app handles it with a beep if visible)
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        const anyVisible = clients.some((c) => c.visibilityState === "visible");
        if (anyVisible) return; // App is visible — it plays beep itself, no notification needed

        self.registration.showNotification("Rest Complete", {
          body: doneBody,
          tag: TIMER_TAG,
          renotify: true,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
        });
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

// Handle server-sent Web Push notifications (update announcements + rest timer backup)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "gymtracker_", body: event.data.text(), tag: "gym-update" };
  }

  const { title = "gymtracker_", body = "", tag = "gym-update", renotify = false, vibrate } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      renotify,
      requireInteraction: tag === TIMER_TAG,
      ...(vibrate ? { vibrate } : {}),
      icon: "/icon.svg",
    })
  );
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
