import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Calendar, Car, MessageCircle,
  Shield, LogOut, ChevronDown, Search, Plus, Menu, X,
  Trophy, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/rides", label: "My Rides", icon: Car },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

function TopNav() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  function handleLogout() {
    logout();
    setLocation("/");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return location === href;
    return location === href || location.startsWith(href + "/");
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-[#0A0B0F]/96 backdrop-blur-md shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-15 gap-3" style={{ height: "3.75rem" }}>
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <span className="text-xl">🚗</span>
              <span className="font-bold text-base bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent hidden sm:block">
                ChaloTogether
              </span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_LINKS.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive(item.href)
                      ? "bg-primary/15 text-primary"
                      : "text-white/55 hover:text-white hover:bg-white/5"
                  }`}>
                    <item.icon size={14} />
                    {item.label}
                  </div>
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/rides/find" className="hidden md:block">
                <Button variant="outline" size="sm" className="border-white/15 text-white/70 hover:text-white hover:bg-white/8 text-xs h-8 gap-1.5 bg-transparent">
                  <Search size={13} /> Find Ride
                </Button>
              </Link>
              <Link href="/rides/offer">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 gap-1.5 shadow-lg shadow-blue-600/20">
                  <Plus size={13} /> <span className="hidden sm:inline">Offer Ride</span>
                </Button>
              </Link>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/60 to-blue-600/20 flex items-center justify-center text-sm font-bold text-white border border-white/10">
                      {user.fullName.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-left min-w-0">
                      <p className="text-xs font-medium text-white leading-none truncate max-w-[80px]">{user.fullName.split(" ")[0]}</p>
                      {user.isVerified
                        ? <span className="text-[10px] text-green-400 flex items-center gap-0.5 mt-0.5"><CheckCircle2 size={9} /> Verified</span>
                        : <span className="text-[10px] text-yellow-400/80 mt-0.5 block">Unverified</span>
                      }
                    </div>
                    <ChevronDown size={13} className="text-white/40 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#13141a] border-white/10 shadow-2xl">
                  <div className="px-3 py-2.5 border-b border-white/8">
                    <p className="text-sm font-semibold text-white">{user.fullName}</p>
                    <p className="text-xs text-white/45 truncate mt-0.5">{user.email}</p>
                    <p className="text-xs text-white/35 mt-0.5">{user.college}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/verify" className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
                      <CheckCircle2 size={14} /> Verify Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/safety" className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
                      <Shield size={14} /> Safety & SOS
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/8" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 focus:bg-red-500/10 cursor-pointer flex items-center gap-2"
                  >
                    <LogOut size={14} /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden text-white/60 hover:text-white p-1 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={19} /> : <Menu size={19} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-white/8 overflow-hidden"
            >
              <nav className="p-3 space-y-0.5 bg-[#0D0E14]/98">
                {NAV_LINKS.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary/15 text-primary"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}>
                      <item.icon size={17} />
                      {item.label}
                    </div>
                  </Link>
                ))}
                <div className="pt-2 border-t border-white/8 flex gap-2 mt-1">
                  <Link href="/rides/find" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full border-white/15 text-white/70 text-xs gap-1.5 bg-transparent">
                      <Search size={13} /> Find Ride
                    </Button>
                  </Link>
                  <Link href="/rides/offer" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-xs gap-1.5">
                      <Plus size={13} /> Offer Ride
                    </Button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification warning strip */}
        {!user.isVerified && location !== "/verify" && (
          <div className="border-t border-yellow-500/15 bg-yellow-500/5 px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
            <span className="text-xs text-yellow-400/80">Complete verification to unlock ride features.</span>
            <Link href="/verify" className="text-xs font-semibold text-yellow-400 underline underline-offset-2 whitespace-nowrap shrink-0">
              Verify Now →
            </Link>
          </div>
        )}
      </header>
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
