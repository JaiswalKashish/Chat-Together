import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListMyCommunities, useListAllCommunities, useJoinCommunity, useLeaveCommunity } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Users, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Communities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("my-communities");

  const { data: myCommunities, refetch: refetchMy } = useListMyCommunities({
    query: { queryKey: ["my-communities"] }
  });
  
  const { data: allCommunities, refetch: refetchAll } = useListAllCommunities({
    query: { queryKey: ["all-communities"] }
  });

  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  const handleJoin = (id: number) => {
    if (!user?.isVerified) {
      toast({ title: "Verification required", description: "Only verified students can join communities.", variant: "destructive" });
      return;
    }
    joinMutation.mutate(
      { data: { communityId: id } },
      {
        onSuccess: () => {
          toast({ title: "Joined community successfully" });
          refetchMy();
          refetchAll();
        }
      }
    );
  };

  const handleLeave = (id: number) => {
    leaveMutation.mutate(
      { data: { communityId: id } },
      {
        onSuccess: () => {
          toast({ title: "Left community" });
          refetchMy();
          refetchAll();
        }
      }
    );
  };

  const CommunityCard = ({ c, isJoined }: { c: any, isJoined: boolean }) => (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg truncate" title={c.name}>{c.name}</h3>
          <p className="text-sm text-muted-foreground">{c.collegeName}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary shrink-0">
          {c.name.substring(0, 2).toUpperCase()}
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Users size={16} /> <span>{c.memberCount} members</span>
        <span className="mx-2">•</span>
        <ShieldCheck size={16} className="text-green-500" /> <span className="text-green-500">Verified</span>
      </div>

      <div className="mt-auto">
        {isJoined ? (
          <Button variant="outline" className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleLeave(c.id)}>
            Leave Community
          </Button>
        ) : (
          <Button className="w-full" onClick={() => handleJoin(c.id)}>
            Join Community
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">College Communities</h1>
            <p className="text-muted-foreground mt-1">Connect with verified peers from your college.</p>
          </div>
          <Tabs value={tab} onValueChange={setTab} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-communities">My Communities</TabsTrigger>
              <TabsTrigger value="explore">Explore All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {tab === "my-communities" && (
          <div>
            {(!myCommunities || myCommunities.length === 0) ? (
              <div className="text-center py-20 bg-card border border-border rounded-xl border-dashed">
                <Users size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-bold mb-2">No communities joined yet</h3>
                <p className="text-muted-foreground mb-6">Join your college community to find rides and events.</p>
                <Button onClick={() => setTab("explore")}>Explore Communities</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCommunities.map(c => <CommunityCard key={c.id} c={c} isJoined={true} />)}
              </div>
            )}
          </div>
        )}

        {tab === "explore" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCommunities?.map(c => <CommunityCard key={c.id} c={c} isJoined={c.isJoined} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
