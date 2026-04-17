/**
 * Shared Google Maps script loader.
 * Ensures the Google Maps JS API is loaded exactly once across the entire app.
 * Both DeviceMap (dashboard) and LocationMapPanel (registry) reuse this.
 */

let loadPromise: Promise<void> | null = null;

/**
 * Fetches the API key from the server-side route and loads the Google Maps script.
 * Returns a resolved promise if already loaded. Throws if loading fails.
 */
export async function loadGoogleMapsScript(): Promise<void> {
  // Already loaded
  if (window.google?.maps) return;

  // Already loading — deduplicate
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // 1. Fetch API key from server
    let apiKey = "";
    try {
      const res = await fetch("/api/maps-key");
      const data = await res.json();
      apiKey = data.key;
    } catch {
      throw new Error("API 키를 가져올 수 없습니다.");
    }

    if (!apiKey) {
      throw new Error("Google Maps API 키가 설정되지 않았습니다.");
    }

    // 2. Check again — another component might have loaded it while we fetched
    if (window.google?.maps) return;

    // 3. Inject script tag
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,geometry,places&v=weekly`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loadPromise = null; // allow retry
        reject(new Error("Google Maps 스크립트를 불러오는데 실패했습니다."));
      };
      document.head.appendChild(script);
    });
  })();

  return loadPromise;
}
