import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListEvents } from "@workspace/api-client-react";
import { Calendar as CalendarIcon, MapPin, Car, Info } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function Events() {
  const { data: events } = useListEvents({
    query: { queryKey: ["events"] }
  });

  const getEventTypeColor = (type: string) => {
    switch(type) {
      case 'exam': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'placement': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'workshop': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'hackathon': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'fest': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-secondary text-foreground border-border';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="text-muted-foreground mt-1">Find ride pools for major college events across Chennai.</p>
        </div>

        {(!events || events.length === 0) ? (
          <div className="text-center py-20 bg-card border border-border rounded-xl border-dashed">
            <CalendarIcon size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-bold mb-2">No upcoming events</h3>
            <p className="text-muted-foreground">Check back later for exams, fests, and placements.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border bg-secondary/30">
                  <Badge className={`mb-3 uppercase text-[10px] tracking-wider font-bold ${getEventTypeColor(event.type)}`} variant="outline">
                    {event.type}
                  </Badge>
                  <h3 className="font-bold text-lg mb-1 leading-tight">{event.title}</h3>
                  <p className="text-sm text-primary font-medium">{event.collegeName}</p>
                </div>
                <div className="p-5 flex-1 flex flex-col space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CalendarIcon size={16} />
                    <span>{format(new Date(event.date), "PPP p")}</span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <MapPin size={16} />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  )}
                  {event.description && (
                    <div className="flex items-start gap-3 text-sm text-muted-foreground mt-2">
                      <Info size={16} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{event.description}</span>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Car size={16} className="text-primary" />
                      <span>{event.ridePoolCount || 0} rides available</span>
                    </div>
                    <span className="text-sm text-primary hover:underline cursor-pointer font-medium">Find Ride</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
