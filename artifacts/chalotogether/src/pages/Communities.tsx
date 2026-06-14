import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListMyCommunities, useListAllCommunities, useJoinCommunity, useLeaveCommunity } from "@workspace/api-client-react";
import type { Community } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Users, ShieldCheck, Check, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export function Communities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: myCommunities = [] } = useListMyCommunities({ query: { queryKey: ["my-communities"] } });
  const { data: allCommunities = [] } = useListAllCommunities({ query: { queryKey: ["all-communities"] } });

  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  function handleJoin(id: number) {
    if (!user?.isVerified) {
      toast({ title: "Verification required", description: "Only verified students can join communities.", variant: "destructive" });
      return;
    }
    joinMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Joined community!" });
          queryClient.invalidateQueries({ queryKey: ["my-communities"] });
          queryClient.invalidateQueries({ queryKey: ["all-communities"] });
        },
        onError: () => toast({ title: "Failed to join", variant: "destructive" }),
      }
    );
  }

  function handleLeave(id: number) {
    leaveMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Left community" });
          queryClient.invalidateQueries({ queryKey: ["my-communities"] });
          queryClient.invalidateQueries({ queryKey: ["all-communities"] });
        },
      }
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
          <p className="text-muted-foreground mt-1">Connect with verified students from your college and beyond.</p>
        </div>

        <Tabs defaultValue="my-communities">
          <TabsList className="mb-6 bg-secondary/50 border border-border/50">
            <TabsTrigger value="my-communities">My Communities ({myCommunities.length})</TabsTrigger>
            <TabsTrigger value="discover">Discover ({allCommunities.filter((c) => !c.isJoined).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="my-communities">
            {myCommunities.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border/50 rounded-2xl">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No communities yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">Join your college community to connect with verified students, find rides, and stay updated on events.</p>
                <Button variant="outline" onClick={() => document.querySelector('[data-value="discover"]')?.dispatchEvent(new MouseEvent("click"))}>
                  Discover Communities
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myCommunities.map((c, idx) => (
                  <CommunityCard
                    key={c.id}
                    community={c}
                    isJoined
                    idx={idx}
                    onLeave={() => handleLeave(c.id)}
                    onView={() => navigate(`/communities/${c.id}`)}
                    loading={leaveMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover">
            {allCommunities.filter((c) => !c.isJoined).length === 0 ? (
              <div className="text-center py-20">
                <ShieldCheck size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">You've joined all available communities!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allCommunities
                  .filter((c) => !c.isJoined)
                  .map((c, idx) => (
                    <CommunityCard
                      key={c.id}
                      community={c}
                      isJoined={false}
                      idx={idx}
                      onJoin={() => handleJoin(c.id)}
                      onView={() => navigate(`/communities/${c.id}`)}
                      loading={joinMutation.isPending}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function CommunityCard({
  community: c,
  isJoined,
  idx,
  onJoin,
  onLeave,
  onView,
  loading,
}: {
  community: Community;
  isJoined: boolean;
  idx: number;
  onJoin?: () => void;
  onLeave?: () => void;
  onView: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="bg-card border border-border/50 rounded-xl p-5 flex flex-col hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg font-bold shrink-0">
              {c.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-tight truncate">{c.name}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{c.collegeName}</p>
            </div>
          </div>
        </div>
        {isJoined && (
          <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-1 shrink-0">
            <Check size={11} /> Joined
          </div>
        )}
      </div>

      {c.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{c.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1"><Users size={13} />{c.memberCount} members</span>
        <span className="flex items-center gap-1"><ShieldCheck size={13} />Verified only</span>
      </div>

      <div className="flex gap-2 mt-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={onView}
          className="flex-1 border-border/50 text-sm hover:border-primary/30"
        >
          View <ChevronRight size={14} className="ml-1" />
        </Button>
        {isJoined ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onLeave}
            disabled={loading}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Leave"}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onJoin}
            disabled={loading}
            className="flex-1 bg-primary hover:bg-primary/90 text-sm"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Join"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
