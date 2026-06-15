import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSearchRides, useBookRide } from "@workspace/api-client-react";
import type { RideDetail } from "@workspace/api-client-react";
import { Search, MapPin, Clock, Users, IndianRupee, Star, CheckCircle2, ArrowRight, Loader2, Car } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RouteMap } from "@/components/RouteMap";

export function FindRide() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [filters, setFilters] = useState({ origin: "", destination: "", date: "", time: "" });
  const [searched, setSearched] = useState(false);
  const [selectedRide, setSelectedRide] = useState<RideDetail | null>(null);
  const [pickupPoint, setPickupPoint] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  const { data: results, isLoading } = useSearchRides(
    { origin: filters.origin, destination: filters.destination, date: filters.date, time: filters.time },
    { query: { queryKey: ["search-rides", filters], enabled: searched } }
  );

  const bookRide = useBookRide();

  function handleSearch() {
    setSearched(true);
  }

  async function handleBook() {
    if (!selectedRide || !pickupPoint.trim()) {
      toast({ title: "Enter your pickup point", variant: "destructive" });
      return;
    }
    try {
      await bookRide.mutateAsync({
        id: selectedRide.id,
        data: { pickupPoint, notes: notes || null },
      });
      toast({ title: "Booking requested!", description: "Waiting for driver to accept." });
      setBookingDialogOpen(false);
      navigate("/rides");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to book ride";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-orange-400";
  }

  function getScoreBg(score: number) {
    if (score >= 80) return "bg-green-500/20 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-orange-500/20 border-orange-500/30";
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Find a Ride</h1>
          <p className="text-muted-foreground mt-1">Search for rides going your way with AI-powered matching.</p>
        </div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-xl p-6 mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="From (e.g., Tambaram)"
                className="pl-9 bg-background border-border/50"
                value={filters.origin}
                onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
              />
            </div>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <Input
                placeholder="To (e.g., SRM Ramapuram)"
                className="pl-9 bg-background border-border/50"
                value={filters.destination}
                onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
              />
            </div>
            <div>
              <Input
                type="date"
                className="bg-background border-border/50"
                value={filters.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>
            <div>
              <Input
                type="time"
                className="bg-background border-border/50"
                value={filters.time}
                onChange={(e) => setFilters({ ...filters, time: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleSearch} className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Search size={16} className="mr-2" />}
            {isLoading ? "Searching…" : "Search Rides"}
          </Button>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {searched && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!results || results.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No rides found</h3>
                  <p className="text-muted-foreground">Try different search criteria or check back later.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{results.length} rides found, sorted by match score</p>
                  {results.map(({ ride, matchScore, matchBreakdown }, idx) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <span className="font-medium">{ride.offererName}</span>
                            {ride.offererVerified && (
                              <CheckCircle2 size={14} className="text-blue-400" />
                            )}
                            <span className="text-muted-foreground text-xs">{ride.offererCollege}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <MapPin size={14} /> {ride.origin}
                            {ride.waypoints && ride.waypoints.length > 0 && (
                              <span className="text-xs text-primary">+{ride.waypoints.length} stops</span>
                            )}
                            <ArrowRight size={14} className="text-primary" />
                            <MapPin size={14} className="text-primary" /> {ride.destination}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Clock size={12} />{ride.date} · {ride.time}</span>
                            <span className="flex items-center gap-1"><Users size={12} />{ride.seatsAvailable} seats left</span>
                            <span className="capitalize">{ride.vehicleType}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge variant="outline" className={`${getScoreBg(matchScore)} ${getScoreColor(matchScore)} font-bold border text-sm px-2 py-1`}>
                            {matchScore}% Match
                          </Badge>
                          <span className="font-bold text-primary flex items-center text-lg">
                            <IndianRupee size={16} />{ride.farePerSeat}<span className="text-xs text-muted-foreground font-normal">/seat</span>
                          </span>
                        </div>
                      </div>

                      {/* Match breakdown */}
                      <div className="bg-secondary/30 rounded-lg p-3 mb-4 border border-border/20">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">AI Match Breakdown</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                          <BreakdownBar label="Destination" value={matchBreakdown.destinationMatch} max={10} />
                          <BreakdownBar label="Route Overlap" value={matchBreakdown.routeOverlap} max={40} />
                          <BreakdownBar label="Time Match" value={matchBreakdown.timeMatch} max={30} />
                          <BreakdownBar label="Pickup Distance" value={matchBreakdown.pickupDistance} max={15} />
                        </div>
                      </div>

                      {ride.offererReliabilityScore && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          Reliability Score: <span className="text-foreground font-medium">{ride.offererReliabilityScore}</span>
                        </div>
                      )}

                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => {
                          setSelectedRide(ride);
                          setPickupPoint("");
                          setBookingDialogOpen(true);
                        }}
                        disabled={ride.seatsAvailable === 0}
                      >
                        {ride.seatsAvailable === 0 ? "No Seats Available" : "Book Ride"}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="bg-card border border-border/50 max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Booking</DialogTitle>
            </DialogHeader>
            {selectedRide && (
              <div className="space-y-4">
                <RouteMap
                  origin={selectedRide.origin}
                  destination={selectedRide.destination}
                  waypoints={selectedRide.waypoints ?? []}
                  height="180px"
                  showInfo={false}
                />
                <div className="bg-secondary/30 rounded-lg p-4 text-sm">
                  <p className="font-medium">{selectedRide.origin} → {selectedRide.destination}</p>
                  <p className="text-muted-foreground mt-0.5">Driver: {selectedRide.offererName} · {selectedRide.date} at {selectedRide.time}</p>
                  <p className="text-primary font-bold mt-2">₹{selectedRide.farePerSeat} per seat</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Your Pickup Point *</label>
                  <Input
                    placeholder="Where should the driver pick you up?"
                    value={pickupPoint}
                    onChange={(e) => setPickupPoint(e.target.value)}
                    className="bg-background border-border/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Notes (optional)</label>
                  <Input
                    placeholder="Any special requests?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-background border-border/50"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setBookingDialogOpen(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleBook} disabled={bookRide.isPending || !pickupPoint.trim()} className="flex-1 bg-primary">
                    {bookRide.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    Request Booking
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function BreakdownBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-muted-foreground w-8 text-right">{value}/{max}</span>
    </div>
  );
}
