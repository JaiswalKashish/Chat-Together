import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCreateRide } from "@workspace/api-client-react";
import { ArrowLeft, Car, Fuel, MapPin, Users, IndianRupee, Plus, X, Loader2, Route } from "lucide-react";
import { motion } from "framer-motion";

const schema = z.object({
  origin: z.string().min(2, "Enter origin"),
  destination: z.string().min(2, "Enter destination"),
  date: z.string().min(1, "Select a date"),
  time: z.string().min(1, "Select time"),
  vehicleType: z.enum(["car", "bike", "auto", "van"]),
  vehicleNumber: z.string().min(4, "Enter vehicle number"),
  fuelType: z.enum(["petrol", "diesel", "electric", "cng"]),
  mileage: z.coerce.number().min(1).max(100),
  totalSeats: z.coerce.number().min(1).max(7),
  farePerSeat: z.coerce.number().min(0),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const RECURRING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function OfferRide() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [waypointInput, setWaypointInput] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const createRide = useCreateRide();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleType: "car",
      fuelType: "petrol",
      mileage: 15,
      totalSeats: 3,
      farePerSeat: 50,
      isRecurring: false,
    },
  });

  const isRecurring = form.watch("isRecurring");
  const vehicleType = form.watch("vehicleType");

  function addWaypoint() {
    const val = waypointInput.trim();
    if (val && !waypoints.includes(val)) {
      setWaypoints([...waypoints, val]);
      setWaypointInput("");
    }
  }

  function removeWaypoint(idx: number) {
    setWaypoints(waypoints.filter((_, i) => i !== idx));
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function onSubmit(values: FormValues) {
    try {
      await createRide.mutateAsync({
        data: {
          ...values,
          waypoints,
          recurringDays: values.isRecurring ? selectedDays : [],
          notes: values.notes ?? null,
          eventId: null,
        },
      });
      toast({ title: "Ride created!", description: "Your ride is now visible to other students." });
      navigate("/rides");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to create ride";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/rides")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm">
          <ArrowLeft size={16} /> Back to My Rides
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Offer a Ride</h1>
          <p className="text-muted-foreground mt-1">Share your commute with verified students and split costs.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Route Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin size={18} className="text-primary" />Route</h3>
            <div className="space-y-4">
              <div>
                <Label>Starting Point *</Label>
                <Input {...form.register("origin")} placeholder="e.g., Tambaram" className="mt-1 bg-background border-border/50" />
                {form.formState.errors.origin && <p className="text-xs text-red-400 mt-1">{form.formState.errors.origin.message}</p>}
              </div>

              {/* Waypoints */}
              {waypoints.length > 0 && (
                <div className="space-y-2">
                  {waypoints.map((wp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2 text-sm">
                        <Route size={14} className="text-muted-foreground" />
                        <span>{wp}</span>
                      </div>
                      <button type="button" onClick={() => removeWaypoint(idx)} className="text-muted-foreground hover:text-red-400">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={waypointInput}
                  onChange={(e) => setWaypointInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addWaypoint())}
                  placeholder="Add intermediate stop (optional)"
                  className="bg-background border-border/50"
                />
                <Button type="button" variant="outline" size="icon" onClick={addWaypoint}>
                  <Plus size={16} />
                </Button>
              </div>

              <div>
                <Label>Destination *</Label>
                <Input {...form.register("destination")} placeholder="e.g., SRM Ramapuram" className="mt-1 bg-background border-border/50" />
                {form.formState.errors.destination && <p className="text-xs text-red-400 mt-1">{form.formState.errors.destination.message}</p>}
              </div>
            </div>
          </motion.div>

          {/* Schedule */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border/50 rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Car size={18} className="text-primary" />Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" {...form.register("date")} className="mt-1 bg-background border-border/50" min={new Date().toISOString().split("T")[0]} />
                {form.formState.errors.date && <p className="text-xs text-red-400 mt-1">{form.formState.errors.date.message}</p>}
              </div>
              <div>
                <Label>Departure Time *</Label>
                <Input type="time" {...form.register("time")} className="mt-1 bg-background border-border/50" />
                {form.formState.errors.time && <p className="text-xs text-red-400 mt-1">{form.formState.errors.time.message}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-secondary/30 border border-border/30">
              <div>
                <p className="text-sm font-medium">Recurring Ride</p>
                <p className="text-xs text-muted-foreground">Repeat this ride on selected days</p>
              </div>
              <Switch
                checked={isRecurring}
                onCheckedChange={(v) => form.setValue("isRecurring", v)}
              />
            </div>

            {isRecurring && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Select days:</p>
                <div className="flex gap-2 flex-wrap">
                  {RECURRING_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedDays.includes(day)
                          ? "bg-primary text-white border-primary"
                          : "bg-secondary/40 text-muted-foreground border-border/30 hover:border-primary/40"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Vehicle Details */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border/50 rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Fuel size={18} className="text-primary" />Vehicle</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vehicle Type *</Label>
                <Select
                  value={vehicleType}
                  onValueChange={(v) => form.setValue("vehicleType", v as "car" | "bike" | "auto" | "van")}
                >
                  <SelectTrigger className="mt-1 bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">🚗 Car</SelectItem>
                    <SelectItem value="bike">🏍️ Bike</SelectItem>
                    <SelectItem value="auto">🛺 Auto</SelectItem>
                    <SelectItem value="van">🚐 Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vehicle Number *</Label>
                <Input {...form.register("vehicleNumber")} placeholder="TN 01 AB 1234" className="mt-1 bg-background border-border/50" />
                {form.formState.errors.vehicleNumber && <p className="text-xs text-red-400 mt-1">{form.formState.errors.vehicleNumber.message}</p>}
              </div>
              <div>
                <Label>Fuel Type</Label>
                <Select
                  value={form.watch("fuelType")}
                  onValueChange={(v) => form.setValue("fuelType", v as "petrol" | "diesel" | "electric" | "cng")}
                >
                  <SelectTrigger className="mt-1 bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mileage (km/l)</Label>
                <Input type="number" {...form.register("mileage")} className="mt-1 bg-background border-border/50" />
              </div>
            </div>
          </motion.div>

          {/* Seats & Fare */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border/50 rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Users size={18} className="text-primary" />Seats & Fare</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Available Seats *</Label>
                <Input type="number" min={1} max={7} {...form.register("totalSeats")} className="mt-1 bg-background border-border/50" />
                {form.formState.errors.totalSeats && <p className="text-xs text-red-400 mt-1">{form.formState.errors.totalSeats.message}</p>}
              </div>
              <div>
                <Label className="flex items-center gap-1"><IndianRupee size={14} />Fare per Seat</Label>
                <Input type="number" min={0} {...form.register("farePerSeat")} className="mt-1 bg-background border-border/50" />
              </div>
            </div>
            <div className="mt-4">
              <Label>Notes (optional)</Label>
              <Input {...form.register("notes")} placeholder="e.g., Drop off near Anna Nagar metro" className="mt-1 bg-background border-border/50" />
            </div>
          </motion.div>

          <div className="flex gap-4 pb-8">
            <Button type="button" variant="outline" onClick={() => navigate("/rides")} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={createRide.isPending} className="flex-1 bg-primary hover:bg-primary/90">
              {createRide.isPending ? <><Loader2 size={16} className="animate-spin mr-2" />Creating…</> : "Create Ride"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
