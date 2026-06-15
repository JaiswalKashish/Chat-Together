import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, AlertCircle, Navigation2 } from "lucide-react";

interface RouteMapProps {
  origin: string;
  destination: string;
  waypoints?: string[];
  height?: string;
  className?: string;
  showInfo?: boolean;
}

interface GeoPoint { lat: number; lng: number; label: string }
interface RouteInfo { distance: string; duration: string }

async function geocode(place: string): Promise<GeoPoint | null> {
  try {
    const q = encodeURIComponent(`${place}, Chennai, Tamil Nadu, India`);
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { "Accept-Language": "en", "User-Agent": "ChaloTogether/1.0" },
    });
    const data = await r.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
    }
  } catch {}
  return null;
}

async function getRoute(points: GeoPoint[]): Promise<{ coords: [number, number][]; info: RouteInfo } | null> {
  try {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
    const data = await r.json();
    if (data?.routes?.[0]) {
      const route = data.routes[0];
      const rawCoords: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      const dist = (route.distance / 1000).toFixed(1);
      const mins = Math.round(route.duration / 60);
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      const duration = hrs > 0 ? `${hrs}h ${rem}m` : `${mins} min`;
      return { coords: rawCoords, info: { distance: `${dist} km`, duration } };
    }
  } catch {}
  return null;
}

export function RouteMap({ origin, destination, waypoints = [], height = "280px", className = "", showInfo = true }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  useEffect(() => {
    if (!origin || !destination) return;

    let destroyed = false;

    async function initMap() {
      setLoading(true);
      setError(null);

      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        if (destroyed || !mapRef.current) return;

        // Clean up previous map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Geocode all points
        const allLabels = [origin, ...waypoints, destination];
        const geoPoints = await Promise.all(allLabels.map(geocode));
        const validPoints = geoPoints.filter(Boolean) as GeoPoint[];

        if (validPoints.length < 2) {
          setError("Could not locate places on map");
          setLoading(false);
          return;
        }

        // Create map centered on midpoint
        const midLat = (validPoints[0].lat + validPoints[validPoints.length - 1].lat) / 2;
        const midLng = (validPoints[0].lng + validPoints[validPoints.length - 1].lng) / 2;

        const map = L.map(mapRef.current!, {
          center: [midLat, midLng],
          zoom: 12,
          zoomControl: true,
          attributionControl: false,
        });

        mapInstanceRef.current = map;

        // Dark-themed tile layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
          subdomains: "abcd",
        }).addTo(map);

        // Fetch route
        const routeData = await getRoute(validPoints);

        if (destroyed) return;

        if (routeData) {
          setRouteInfo(routeData.info);
          // Draw route polyline
          L.polyline(routeData.coords, {
            color: "#3b82f6",
            weight: 4,
            opacity: 0.9,
          }).addTo(map);
        }

        // Add markers
        const startIcon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:#22c55e;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(34,197,94,0.6)"></div>`,
          className: "",
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const endIcon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(239,68,68,0.6)"></div>`,
          className: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const waypointIcon = L.divIcon({
          html: `<div style="width:10px;height:10px;background:#f59e0b;border-radius:50%;border:2px solid white"></div>`,
          className: "",
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });

        L.marker([validPoints[0].lat, validPoints[0].lng], { icon: startIcon })
          .addTo(map)
          .bindTooltip(origin, { permanent: false, direction: "right" });

        for (let i = 1; i < validPoints.length - 1; i++) {
          L.marker([validPoints[i].lat, validPoints[i].lng], { icon: waypointIcon })
            .addTo(map)
            .bindTooltip(waypoints[i - 1], { permanent: false, direction: "right" });
        }

        L.marker([validPoints[validPoints.length - 1].lat, validPoints[validPoints.length - 1].lng], { icon: endIcon })
          .addTo(map)
          .bindTooltip(destination, { permanent: false, direction: "right" });

        // Fit map to show all markers
        const bounds = L.latLngBounds(validPoints.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40] });

        setLoading(false);
      } catch (err) {
        if (!destroyed) {
          setError("Failed to load map");
          setLoading(false);
        }
      }
    }

    initMap();

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [origin, destination, waypoints.join(",")]);

  return (
    <div className={`relative rounded-xl overflow-hidden bg-[#1a1b20] border border-white/8 ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1b20]/90 gap-3">
          <Loader2 className="animate-spin text-primary" size={28} />
          <p className="text-sm text-white/60">Loading route map…</p>
        </div>
      )}

      {error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1b20] gap-3">
          <AlertCircle size={28} className="text-white/30" />
          <p className="text-sm text-white/50">{error}</p>
        </div>
      )}

      {/* Route info overlay */}
      {showInfo && routeInfo && !loading && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <MapPin size={12} className="text-green-400" />
            <span className="text-xs text-white/90 font-medium">{origin}</span>
            <span className="text-white/30 text-xs">→</span>
            <MapPin size={12} className="text-red-400" />
            <span className="text-xs text-white/90 font-medium">{destination}</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-600/80 backdrop-blur-sm rounded-lg px-3 py-1.5 gap-3">
            <span className="text-xs text-white font-medium">{routeInfo.distance}</span>
            <span className="text-white/50 text-xs">·</span>
            <span className="text-xs text-white font-medium flex items-center gap-1">
              <Navigation2 size={11} /> {routeInfo.duration}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
