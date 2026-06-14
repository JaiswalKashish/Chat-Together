import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { token, user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    if (window.location.pathname !== "/") {
      setLocation("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-2xl">🚗</span>
            <span className="bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
              ChaloTogether
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <button onClick={() => handleScrollTo("how-it-works")} className="hover:text-foreground transition-colors">How It Works</button>
          <button onClick={() => handleScrollTo("colleges")} className="hover:text-foreground transition-colors">Colleges</button>
          <button onClick={() => handleScrollTo("safety")} className="hover:text-foreground transition-colors">Safety</button>
          <button onClick={() => handleScrollTo("events")} className="hover:text-foreground transition-colors">Events</button>
          <button onClick={() => handleScrollTo("about")} className="hover:text-foreground transition-colors">About Us</button>
        </div>

        <div className="flex items-center gap-4">
          {token ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Button onClick={() => { logout(); setLocation("/"); }} variant="secondary" size="sm">
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                Log In
              </Link>
              <Button onClick={() => setLocation("/register")} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
