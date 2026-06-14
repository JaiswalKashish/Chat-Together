import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Trophy, Star } from "lucide-react";

export function Leaderboard() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-full flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Top contributors making Chennai greener and safer.</p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20 px-4">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-card border border-border rounded-full flex items-center justify-center">
                <Trophy size={40} className="text-primary" />
                <Star size={16} className="absolute -top-2 -right-2 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              We're calculating the carbon emission savings and ride milestones. The leaderboard will be available soon.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
