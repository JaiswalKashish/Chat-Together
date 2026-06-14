import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Users, Calendar, Car, Trophy, LogOut, ShieldAlert } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user) {
    // Redirect should happen at router level or useEffect in children, but as a safeguard
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/communities", label: "Communities", icon: Users },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/rides", label: "My Rides", icon: Car },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span>🚗</span>
            <span className="bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
              ChaloTogether
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                location === item.href 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}>
                <item.icon size={18} />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-secondary/30">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              {user.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.college}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <span>🚗</span>
            <span>ChaloTogether</span>
          </Link>
          <button onClick={handleLogout} className="text-muted-foreground">
            <LogOut size={20} />
          </button>
        </header>

        {/* Global Verification Warning */}
        {!user.isVerified && location !== "/verify" && (
          <div className="bg-destructive/10 border-b border-destructive/20 p-3 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert size={16} />
              <span className="text-sm font-medium">Your account is not fully verified. You cannot offer or request rides yet.</span>
            </div>
            <Link href="/verify" className="text-sm font-semibold text-destructive underline">
              Verify Now
            </Link>
          </div>
        )}

        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around p-2 z-50">
           {navItems.slice(0, 4).map((item) => (
             <Link key={item.href} href={item.href}>
               <div className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                 location === item.href ? "text-primary" : "text-muted-foreground"
               }`}>
                 <item.icon size={20} />
                 <span className="text-[10px] font-medium">{item.label}</span>
               </div>
             </Link>
           ))}
        </nav>
      </main>
    </div>
  );
}
