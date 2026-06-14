import { useRoute, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGetRide, useGetRideBookings, useAcceptBooking, useRejectBooking, useVerifyRideOtp, useCancelRide } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, MapPin, Clock, Users, Car, CheckCircle, XCircle, Loader2, KeyRound, ArrowRight, Star } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-green-500/20 text-green-400 border-green-500/30",
    accepted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    passenger_picked_up: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    requested: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  return (
    <Badge variant="outline" className={`${map[status] ?? "bg-secondary text-muted-foreground"} capitalize`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function RideDetail() {
  const [match, params] = useRoute("/rides/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [otpInput, setOtpInput] = useState("");
  const [verifyingBookingId, setVerifyingBookingId] = useState<number | null>(null);

  const rideId = match ? parseInt(params!.id, 10) : 0;
  const { data: ride, isLoading, refetch } = useGetRide(rideId, { query: { enabled: rideId > 0, queryKey: ["ride", rideId] } });
  const { data: bookings, refetch: refetchBookings } = useGetRideBookings(rideId, {
    query: { enabled: rideId > 0 && ride?.offererId === user?.id, queryKey: ["ride-bookings", rideId] },
  });

  const acceptBooking = useAcceptBooking();
  const rejectBooking = useRejectBooking();
  const verifyOtp = useVerifyRideOtp();
  const cancelRide = useCancelRide();

  const isDriver = ride?.offererId === user?.id;

  async function handleAccept(bookingId: number) {
    try {
      await acceptBooking.mutateAsync({ id: bookingId });
      toast({ title: "Booking accepted!" });
      refetch(); refetchBookings();
    } catch {
      toast({ title: "Failed to accept", variant: "destructive" });
    }
  }

  async function handleReject(bookingId: number) {
    try {
      await rejectBooking.mutateAsync({ id: bookingId });
      toast({ title: "Booking rejected" });
      refetchBookings();
    } catch {
      toast({ title: "Failed to reject", variant: "destructive" });
    }
  }

  async function handleVerifyOtp(bookingId: number) {
    if (!otpInput.trim()) return;
    try {
      await verifyOtp.mutateAsync({ id: bookingId, data: { otp: otpInput.trim() } });
      toast({ title: "Passenger picked up! Ride started." });
      setOtpInput("");
      setVerifyingBookingId(null);
      refetch();
    } catch {
      toast({ title: "Invalid OTP", variant: "destructive" });
    }
  }

  async function handleCancel() {
    if (!rideId) return;
    try {
      await cancelRide.mutateAsync({ id: rideId });
      toast({ title: "Ride cancelled" });
      navigate("/rides");
    } catch {
      toast({ title: "Failed to cancel", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  if (!ride) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Ride not found</p>
          <Button onClick={() => navigate("/rides")} className="mt-4">Back to Rides</Button>
        </div>
      </DashboardLayout>
    );
  }

  const trackUrl = `${window.location.origin}/track/${ride.trackingToken}`;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/rides")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to My Rides
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Ride Details</h1>
            <p className="text-muted-foreground text-sm mt-1">Ride #{ride.id}</p>
          </div>
          <StatusBadge status={ride.status} />
        </div>

        {/* Route Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-3 text-lg font-medium mb-4">
            <MapPin size={20} className="text-muted-foreground" /> {ride.origin}
            {ride.waypoints && ride.waypoints.length > 0 && (
              <span className="text-xs text-primary">→ {ride.waypoints.join(" → ")}</span>
            )}
            <ArrowRight size={20} className="text-primary" />
            <MapPin size={20} className="text-primary" /> {ride.destination}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Date</p>
              <p className="font-medium flex items-center gap-1 mt-0.5"><Clock size={14} />{ride.date}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Time</p>
              <p className="font-medium mt-0.5">{ride.time}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Seats</p>
              <p className="font-medium flex items-center gap-1 mt-0.5"><Users size={14} />{ride.seatsAvailable}/{ride.totalSeats}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Fare</p>
              <p className="font-bold text-primary mt-0.5">₹{ride.farePerSeat}/seat</p>
            </div>
          </div>
        </motion.div>

        {/* Driver & Vehicle Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border/50 rounded-xl p-6 mb-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Car size={18} />Vehicle & Driver</h3>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div><span className="text-muted-foreground">Driver: </span><span className="font-medium">{ride.offererName}</span></div>
            <div><span className="text-muted-foreground">College: </span><span>{ride.offererCollege}</span></div>
            <div><span className="text-muted-foreground">Vehicle: </span><span className="capitalize">{ride.vehicleType}</span></div>
            <div><span className="text-muted-foreground">Reg No: </span><span className="font-mono">{ride.vehicleNumber}</span></div>
            <div><span className="text-muted-foreground">Fuel: </span><span className="capitalize">{ride.fuelType}</span></div>
            {ride.offererVerified && (
              <div className="flex items-center gap-1 text-blue-400 text-xs"><CheckCircle size={14} /> Verified Student</div>
            )}
          </div>
        </motion.div>

        {/* Tracking link (for driver) */}
        {isDriver && ride.trackingToken && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium mb-1">Share Live Tracking Link</p>
            <p className="text-xs text-muted-foreground mb-2">Send this link to your family or trusted contacts so they can track your trip in real time (no login required).</p>
            <div className="flex gap-2">
              <Input value={trackUrl} readOnly className="text-xs bg-background font-mono" />
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(trackUrl); toast({ title: "Link copied!" }); }}>
                Copy
              </Button>
            </div>
          </motion.div>
        )}

        {/* Driver: Booking Requests */}
        {isDriver && bookings && bookings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border/50 rounded-xl p-6 mb-4">
            <h3 className="font-semibold mb-4">Booking Requests ({bookings.length})</h3>
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="border border-border/30 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{b.passengerName}</p>
                        {b.passengerVerified && <CheckCircle size={14} className="text-blue-400" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{b.passengerCollege}</p>
                      <p className="text-sm mt-1">Pickup: <span className="text-foreground">{b.pickupPoint}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`text-xs ${
                        b.status === "requested" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        b.status === "accepted" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}>{b.status}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star size={11} className="fill-yellow-400 text-yellow-400" />
                        {b.passengerReliabilityScore}
                      </div>
                    </div>
                  </div>

                  {b.status === "requested" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleReject(b.id)} className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10">
                        <XCircle size={14} className="mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => handleAccept(b.id)} disabled={acceptBooking.isPending} className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30">
                        <CheckCircle size={14} className="mr-1" /> Accept
                      </Button>
                    </div>
                  )}

                  {b.status === "accepted" && (
                    <div className="mt-2">
                      {verifyingBookingId === b.id ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter passenger OTP"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            className="font-mono bg-background text-center text-xl tracking-widest"
                            maxLength={4}
                          />
                          <Button size="sm" onClick={() => handleVerifyOtp(b.id)} disabled={verifyOtp.isPending}>
                            {verifyOtp.isPending ? <Loader2 size={14} className="animate-spin" /> : "Verify"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setVerifyingBookingId(null)}>✕</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setVerifyingBookingId(b.id)} className="w-full border-primary/20 text-primary hover:bg-primary/5">
                          <KeyRound size={14} className="mr-2" /> Verify Passenger OTP
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Driver actions */}
        {isDriver && ride.status === "open" && (
          <Button onClick={handleCancel} variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10" disabled={cancelRide.isPending}>
            {cancelRide.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <XCircle size={16} className="mr-2" />}
            Cancel Ride
          </Button>
        )}
      </div>
    </DashboardLayout>
  );
}
