/* Lokhi service worker — minimal cache-first offline support for the app shell,
   plus Web Share Target handling (Android/Chrome; iOS Safari does not support
   share_target, see README). */
const CACHE_NAME = "lokhi-v13";
const SHARE_CACHE_NAME = "lokhi-share-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./onboarding.html",
  "./share-target.html",
  "./app-data.js",
  "./app-styles.css",
  "./app.js",
  "./dreamlab-data.js",
  "./dream-calculations.js",
  "./dream-engine.js",
  "./dreamlab.js",
  "./dreamlab-styles.css",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon-180.png",
  "./lokhi-assets/fairy-mark.svg",
  "./lokhi-assets/owl-dormant.svg",
  "./lokhi-assets/owl-ontrack.svg",
  "./lokhi-assets/owl-crowned.svg",
  "./lokhi-assets/avatars/explorer.svg",
  "./lokhi-assets/avatars/strategist.svg",
  "./lokhi-assets/avatars/builder.svg",
  "./lokhi-assets/avatars/dreamer.svg",
  "./lokhi-assets/avatars/adventurer.svg",
  "./lokhi-assets/avatars/investor.svg",
  "./lokhi-assets/avatars/creator.svg",
  "./lokhi-assets/avatars/custom.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = [CACHE_NAME, SHARE_CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Web Share Target: iOS Safari doesn't support share_target at all, but on
  // Android/Chrome the installed PWA can be launched with this POST. We
  // intercept it here (no server involved) so it works on a static host.
  if (event.request.method === "POST" && url.pathname.endsWith("/share-target.html")) {
    event.respondWith(handleShareTarget(event));
    return;
  }

  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});

async function handleShareTarget(event) {
  const formData = await event.request.formData();
  const meta = {
    title: formData.get("title") || "",
    text: formData.get("text") || "",
    url: formData.get("url") || "",
    files: []
  };

  const cache = await caches.open(SHARE_CACHE_NAME);
  const files = formData.getAll("files").filter((f) => f && f.size > 0);
  files.forEach((file, i) => {
    const key = "/shared-file-" + i;
    meta.files.push({ key, name: file.name, type: file.type });
    cache.put(key, new Response(file, { headers: { "Content-Type": file.type || "application/octet-stream" } }));
  });

  await cache.put("/shared-meta", new Response(JSON.stringify(meta), {
    headers: { "Content-Type": "application/json" }
  }));

  return Response.redirect("./share-target.html?shared=1", 303);
}
