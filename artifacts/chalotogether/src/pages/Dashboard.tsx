import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Users, Calendar, Car, ShieldCheck, AlertCircle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Safe check
  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  const { data: summary, isLoading } = useGetDashboardSummary({
    query: {
      enabled: !!user,
      queryKey: ["dashboard-summary"]
    }
  });

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.fullName.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening in your college network today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 text-primary mb-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Users size={20} /></div>
              <h3 className="font-medium text-sm text-muted-foreground">Communities</h3>
            </div>
            <p className="text-3xl font-bold">{isLoading ? "-" : summary?.communitiesJoined}</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 text-blue-400 mb-3">
              <div className="p-2 bg-blue-400/10 rounded-lg"><Calendar size={20} /></div>
              <h3 className="font-medium text-sm text-muted-foreground">Upcoming Events</h3>
            </div>
            <p className="text-3xl font-bold">{isLoading ? "-" : summary?.upcomingEvents}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 text-green-400 mb-3">
              <div className="p-2 bg-green-400/10 rounded-lg"><Car size={20} /></div>
              <h3 className="font-medium text-sm text-muted-foreground">Active Rides</h3>
            </div>
            <p className="text-3xl font-bold">{isLoading ? "-" : summary?.activeRides}</p>
          </div>

          <div className={`bg-card border rounded-xl p-5 shadow-sm ${user.isVerified ? 'border-border' : 'border-destructive/50'}`}>
            <div className={`flex items-center gap-3 mb-3 ${user.isVerified ? 'text-green-400' : 'text-destructive'}`}>
              <div className={`p-2 rounded-lg ${user.isVerified ? 'bg-green-400/10' : 'bg-destructive/10'}`}>
                {user.isVerified ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
              </div>
              <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
            </div>
            <p className={`text-xl font-bold ${user.isVerified ? 'text-foreground' : 'text-destructive'}`}>
              {user.isVerified ? 'Verified' : 'Pending'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-6 justify-start text-left bg-card hover:bg-secondary/80 border-border hover:border-primary/50 group transition-all"
              onClick={() => setLocation("/rides")}
            >
              <div className="p-3 bg-primary/10 text-primary rounded-xl mr-4 group-hover:scale-110 transition-transform">
                <Search size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Find a Ride</h3>
                <p className="text-sm text-muted-foreground font-normal">Search for ride pools to your college or exams.</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-6 justify-start text-left bg-card hover:bg-secondary/80 border-border hover:border-primary/50 group transition-all"
              onClick={() => setLocation("/rides")}
              disabled={!user.isVerified}
            >
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Offer a Ride</h3>
                <p className="text-sm text-muted-foreground font-normal">Have extra seats? Share costs with verified students.</p>
              </div>
            </Button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
