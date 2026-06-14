import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";

import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Verify } from "@/pages/Verify";
import { Dashboard } from "@/pages/Dashboard";
import { Communities } from "@/pages/Communities";
import { CommunityDetail } from "@/pages/CommunityDetail";
import { Events } from "@/pages/Events";
import { Rides } from "@/pages/Rides";
import { OfferRide } from "@/pages/OfferRide";
import { FindRide } from "@/pages/FindRide";
import { RideDetail } from "@/pages/RideDetail";
import { Messages } from "@/pages/Messages";
import { TrustedContacts } from "@/pages/TrustedContacts";
import { PublicTracking } from "@/pages/PublicTracking";
import { Leaderboard } from "@/pages/Leaderboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify" component={Verify} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/communities" component={Communities} />
      <Route path="/communities/:id" component={CommunityDetail} />
      <Route path="/events" component={Events} />
      <Route path="/rides" component={Rides} />
      <Route path="/rides/offer" component={OfferRide} />
      <Route path="/rides/find" component={FindRide} />
      <Route path="/rides/:id" component={RideDetail} />
      <Route path="/messages" component={Messages} />
      <Route path="/safety" component={TrustedContacts} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/track/:token" component={PublicTracking} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
