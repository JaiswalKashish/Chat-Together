import { useRoute } from "wouter";
import { useGetPublicTrip } from "@workspace/api-client-react";
import { useEffect, useRef, useState } from "react";
import { Car, MapPin, Loader2, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { io, Socket } from "socket.io-client";

function StatusDot({ status }: { status: string }) {
  const active = ["accepted", "passenger_picked_up", "ride_started"].includes(status);
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${active ? "bg-green-400 animate-pulse" : "bg-secondary"}`} />
  );
}

export function PublicTracking() {
  const [match, params] = useRoute("/track/:token");
  const token = match ? params!.token : "";
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const { data: trip, isLoading, error } = useGetPublicTrip(token, {
    query: { enabled: !!token, queryKey: ["public-trip", token], refetchInterval: 10000 },
  });

  // Socket.io for live location
  useEffect(() => {
    if (!token || !trip) return;
    const socket = io(window.location.origin, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("trackTrip", token));
    socket.on("locationUpdate", (data: { lat: number; lng: number }) => {
      setLiveLocation(data);
    });
    return () => { socket.disconnect(); };
  }, [token, !!trip]);

  // Set initial location from API
  useEffect(() => {
    if (trip?.currentLat && trip?.currentLng) {
      setLiveLocation({ lat: trip.currentLat, lng: trip.currentLng });
    }
  }, [trip?.currentLat, trip?.currentLng]);

  const lat = liveLocation?.lat ?? trip?.currentLat;
  const lng = liveLocation?.lng ?? trip?.currentLng;
  const mapUrl = lat && lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
          <p className="text-white/60">Loading trip details…</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin size={28} className="text-red-400" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Trip Not Found</h2>
          <p className="text-white/60 text-sm">This tracking link may be expired or invalid.</p>
        </div>
      </div>
    );
  }

  const isLive = ["accepted", "passenger_picked_up", "ride_started"].includes(trip.status);

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0D0E14] to-transparent p-6 border-b border-white/10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Car size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-white/60">Live Trip Tracking</p>
              <p className="font-bold text-lg">ChaloTogether</p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${
            isLive ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-secondary/50 border-white/10 text-white/60"
          }`}>
            <StatusDot status={trip.status} />
            {isLive ? "Trip in Progress" : trip.status.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-64">
        {mapUrl ? (
          <iframe
            src={mapUrl}
            className="w-full h-full min-h-64 border-0"
            title="Live location map"
            style={{ filter: "invert(0.9) hue-rotate(180deg) saturate(0.8)" }}
          />
        ) : (
          <div className="w-full h-full min-h-64 bg-secondary/20 flex items-center justify-center">
            <div className="text-center">
              <MapPin size={40} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-white/60">
                {isLive ? "Waiting for driver location…" : "Location not yet shared"}
              </p>
            </div>
          </div>
        )}

        {liveLocation && (
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-green-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live Location
          </div>
        )}
      </div>

      {/* Trip Info */}
      <div className="bg-[#0D0E14] border-t border-white/10 p-6">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <MapPin size={16} className="text-white/50 shrink-0" />
            <span>{trip.origin}</span>
            <ArrowRight size={14} className="text-primary shrink-0" />
            <MapPin size={16} className="text-primary shrink-0" />
            <span>{trip.destination}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">Driver</p>
              <p className="font-semibold">{trip.driverName}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">Vehicle</p>
              <p className="font-semibold capitalize">{trip.vehicleType}</p>
              <p className="text-xs text-white/60 font-mono mt-0.5">{trip.vehicleNumber}</p>
            </div>
          </div>

          {trip.status === "completed" && (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
              <CheckCircle size={18} />
              <p className="text-sm font-medium">Trip completed safely.</p>
            </div>
          )}

          <p className="text-center text-xs text-white/30 mt-4">
            This is a shared tracking link. No login required.
            <br />Powered by ChaloTogether — Verified Student Rides
          </p>
        </div>
      </div>
    </div>
  );
}
