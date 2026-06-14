import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Car, Plus, Search, MapPin, Clock, Users, CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetMyRides } from "@workspace/api-client-react";
import { motion } from "framer-motion";

function statusBadge(status: string) {
  const variants: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    booking_requested: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    accepted: { label: "Accepted", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    passenger_picked_up: { label: "Picked Up", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    ride_started: { label: "In Progress", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    completed: { label: "Completed", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    cancelled: { label: "Cancelled", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    requested: { label: "Requested", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    rejected: { label: "Rejected", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    picked_up: { label: "Picked Up", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  };
  const v = variants[status] ?? { label: status, className: "bg-secondary text-muted-foreground" };
  return <Badge variant="outline" className={`text-xs ${v.className}`}>{v.label}</Badge>;
}

export function Rides() {
  const [, navigate] = useLocation();
  const { data: myRides, isLoading } = useGetMyRides({ query: { queryKey: ["my-rides"] } });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  const offered = myRides?.offered ?? [];
  const booked = myRides?.booked ?? [];
  const completed = myRides?.completed ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Rides</h1>
            <p className="text-muted-foreground mt-1">Manage your offered and booked rides.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/rides/find")} className="border-primary/20 hover:bg-primary/5">
              <Search className="mr-2 h-4 w-4" /> Find Ride
            </Button>
            <Button onClick={() => navigate("/rides/offer")} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Offer Ride
            </Button>
          </div>
        </div>

        <Tabs defaultValue="offered">
          <TabsList className="mb-6 bg-secondary/50 border border-border/50">
            <TabsTrigger value="offered">Offered ({offered.length})</TabsTrigger>
            <TabsTrigger value="booked">Booked ({booked.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="offered">
            {offered.length === 0 ? (
              <EmptyState
                icon={<Car size={32} />}
                title="No active rides offered"
                desc="Offer a ride to your college and help your fellow students commute."
                action={<Button onClick={() => navigate("/rides/offer")}><Plus className="mr-2 h-4 w-4" />Offer a Ride</Button>}
              />
            ) : (
              <div className="space-y-4">
                {offered.map((ride) => (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/rides/${ride.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <MapPin size={14} /> {ride.origin}
                          <ArrowRight size={14} className="text-primary" />
                          <MapPin size={14} className="text-primary" /> {ride.destination}
                        </div>
                        <div className="flex items-center gap-4 text-sm mt-2">
                          <span className="flex items-center gap-1 text-muted-foreground"><Clock size={14} />{ride.date} at {ride.time}</span>
                          <span className="flex items-center gap-1 text-muted-foreground"><Users size={14} />{ride.seatsAvailable}/{ride.totalSeats} seats</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {statusBadge(ride.status)}
                        <span className="text-lg font-bold text-primary">₹{ride.farePerSeat}/seat</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/30 pt-3">
                      <span className="capitalize">{ride.vehicleType}</span>
                      <span>•</span>
                      <span>{ride.vehicleNumber}</span>
                      <span>•</span>
                      <span className="capitalize">{ride.fuelType}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="booked">
            {booked.length === 0 ? (
              <EmptyState
                icon={<Search size={32} />}
                title="No active bookings"
                desc="Find a ride going your way and book a seat."
                action={<Button variant="outline" onClick={() => navigate("/rides/find")}><Search className="mr-2 h-4 w-4" />Find a Ride</Button>}
              />
            ) : (
              <div className="space-y-4">
                {booked.map(({ booking, ride }) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/rides/${ride.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <MapPin size={14} /> {ride.origin}
                          <ArrowRight size={14} className="text-primary" />
                          <MapPin size={14} className="text-primary" /> {ride.destination}
                        </div>
                        <p className="text-sm mt-1">Driver: <span className="text-foreground font-medium">{ride.offererName}</span></p>
                        <div className="flex items-center gap-4 text-sm mt-1">
                          <span className="flex items-center gap-1 text-muted-foreground"><Clock size={14} />{ride.date} at {ride.time}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {statusBadge(booking.status)}
                        <span className="text-lg font-bold text-primary">₹{booking.farePerSeat}</span>
                      </div>
                    </div>
                    {booking.status === "accepted" && (
                      <div className="border-t border-border/30 pt-3 mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Your pickup OTP (share with driver at pickup):</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-2xl font-bold text-primary tracking-widest">{booking.otp}</span>
                          <CheckCircle size={16} className="text-green-400" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Pickup: {booking.pickupPoint}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completed.length === 0 ? (
              <EmptyState icon={<CheckCircle size={32} />} title="No completed rides yet" desc="Your ride history will appear here." />
            ) : (
              <div className="space-y-4">
                {completed.map((ride) => (
                  <div key={ride.id} className="bg-card border border-border/50 rounded-xl p-5 opacity-75">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin size={14} /> {ride.origin}
                          <ArrowRight size={14} />
                          <MapPin size={14} /> {ride.destination}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{ride.date}</p>
                      </div>
                      {statusBadge(ride.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{desc}</p>
      {action}
    </div>
  );
}
