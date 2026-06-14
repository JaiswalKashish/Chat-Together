import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Car, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListRides } from "@workspace/api-client-react";

export function Rides() {
  const { data: rides } = useListRides({
    query: { queryKey: ["rides"] }
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Rides</h1>
            <p className="text-muted-foreground mt-1">Manage your upcoming and past carpools.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="hidden sm:flex"><Search className="mr-2 h-4 w-4" /> Find Ride</Button>
            <Button><Plus className="mr-2 h-4 w-4" /> Offer Ride</Button>
          </div>
        </div>

        {(!rides || rides.length === 0) ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Car size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No rides available</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                You haven't requested or offered any rides yet. Start carpooling to save money and reduce traffic.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" className="px-8 border-primary/20 hover:bg-primary/5">Find a Ride</Button>
                <Button className="px-8">Offer a Ride</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {/* Real implementation would render rides here */}
            <p>Rides list</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
