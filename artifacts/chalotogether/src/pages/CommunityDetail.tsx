import { useRoute, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetCommunity, useGetCommunityMembers, useListEvents } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, CheckCircle2, Star, Loader2, Calendar, Car, MessageCircle, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

export function CommunityDetail() {
  const [match, params] = useRoute("/communities/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const communityId = match ? parseInt(params!.id, 10) : 0;

  const { data: community, isLoading } = useGetCommunity(communityId, {
    query: { enabled: communityId > 0, queryKey: ["community", communityId] },
  });
  const { data: members = [], isLoading: membersLoading } = useGetCommunityMembers(communityId, {
    query: { enabled: communityId > 0, queryKey: ["community-members", communityId] },
  });
  const { data: events = [] } = useListEvents({
    query: { queryKey: ["events"] },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  if (!community) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Community not found</p>
          <Button onClick={() => navigate("/communities")} className="mt-4">Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const communityEvents = events.filter((e) => e.collegeId === community.collegeId);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/communities")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Communities
        </button>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 via-card to-card border border-border/50 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{community.name}</h1>
              <p className="text-muted-foreground text-sm">{community.collegeName}</p>
              {community.description && (
                <p className="text-sm text-muted-foreground mt-2">{community.description}</p>
              )}
            </div>
            {community.isJoined && (
              <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 shrink-0">
                <CheckCircle2 size={13} /> Member
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <StatCard icon={<Users size={18} />} value={community.memberCount} label="Total Members" />
            <StatCard icon={<BadgeCheck size={18} />} value={community.activeMembers} label="Active Members" />
            <StatCard icon={<Calendar size={18} />} value={community.upcomingEvents} label="Upcoming Events" />
            <StatCard icon={<Car size={18} />} value={community.communityRides} label="Community Rides" />
          </div>
        </motion.div>

        <Tabs defaultValue="members">
          <TabsList className="mb-6 bg-secondary/50 border border-border/50">
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="events">Events ({communityEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            {membersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users size={32} className="mx-auto mb-3 opacity-50" />
                <p>No members yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {members.map((member, idx) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-card border border-border/50 rounded-xl p-4 flex items-start gap-4 hover:border-primary/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-lg font-bold shrink-0">
                      {member.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm truncate">{member.fullName}</span>
                        {member.isVerified && (
                          <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{member.department} · {member.year}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-muted-foreground">Reliability:</span>
                          <span className="font-medium text-foreground">{member.reliabilityScore}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/messages`)}
                      className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    >
                      <MessageCircle size={16} />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            {communityEvents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Calendar size={32} className="mx-auto mb-3 opacity-50" />
                <p>No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {communityEvents.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-card border border-border/50 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{event.title}</p>
                        {event.description && <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={12} />{event.date}</span>
                          {event.venue && <span>{event.venue}</span>}
                        </div>
                      </div>
                      <span className="text-xs bg-secondary px-2 py-1 rounded-full capitalize border border-border/30">
                        {event.type}
                      </span>
                    </div>
                    {(event.ridePoolCount ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-primary border-t border-border/20 pt-2">
                        <Car size={13} />
                        {event.ridePoolCount} ride{event.ridePoolCount !== 1 ? "s" : ""} available for this event
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-secondary/30 rounded-xl p-4 text-center border border-border/30">
      <div className="text-primary mb-1 flex justify-center">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
