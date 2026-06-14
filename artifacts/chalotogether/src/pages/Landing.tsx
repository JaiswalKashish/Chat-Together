import { motion } from "framer-motion";
import { Car, MapPin, Shield, Users, Building2, Calendar, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useListColleges } from "@workspace/api-client-react";

const hardcodedColleges = [
  "SRM Institute of Science and Technology (Ramapuram)",
  "IIT Madras",
  "Anna University",
  "Loyola College",
  "Sathyabama Institute of Science and Technology",
  "Saveetha Engineering College",
  "Vels Institute of Science, Technology & Advanced Studies",
  "Hindustan Institute of Technology and Science",
  "Madras Christian College",
  "D.G. Vaishnav College"
];

export function Landing() {
  const [, setLocation] = useLocation();
  const { data: collegesData } = useListColleges();

  const colleges = collegesData && collegesData.length > 0
    ? collegesData.map(c => c.name)
    : hardcodedColleges;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-screen" />
            <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-blue-600/20 rounded-full blur-3xl opacity-50 mix-blend-screen" />
            
            <motion.div
              animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute top-[30%] left-[15%] text-primary/30"
            >
              <Car size={48} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
              className="absolute top-[20%] right-[20%] text-blue-400/30"
            >
              <MapPin size={40} />
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-[30%] left-[25%] text-primary/20"
            >
              <Users size={56} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 25, 0], rotate: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-[20%] right-[30%] text-blue-500/30"
            >
              <Shield size={44} />
            </motion.div>
          </div>

          <div className="container relative z-10 px-4 md:px-6 text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                CHALOTOGETHER
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-xl md:text-2xl font-medium text-blue-400 mb-6">
                The Student Mobility Network for Chennai Colleges
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Travel safely, save money, join ride pools for exams, workshops, placements, and college events with verified students across Chennai.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.5)]" onClick={() => setLocation("/register")}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full border-blue-500/30 hover:bg-blue-500/10" onClick={() => setLocation("/register")}>
                Join Your College
              </Button>
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-card/50 relative">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Four simple steps to start carpooling with verified students from your college and across Chennai.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: Shield, title: "1. Verify Identity", desc: "Upload your student ID and verify your email/phone to access the network safely." },
                { icon: Building2, title: "2. Join Community", desc: "Connect with your specific college community and see rides relevant to you." },
                { icon: Route, title: "3. Find/Offer Rides", desc: "Post a ride or find a seat for daily commutes, exams, or events." },
                { icon: Users, title: "4. Travel Safely", desc: "Share rides with verified peers, save money, and reduce your carbon footprint." }
              ].map((step, i) => (
                <div key={i} className="bg-background border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-6 text-primary">
                    <step.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COLLEGES */}
        <section id="colleges" className="py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Supported Colleges</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Join your verified college community. Expanding across Chennai colleges.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {colleges.map((college, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-card/80 transition-colors cursor-default">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-primary shrink-0">
                    {college.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate" title={college}>{college}</h4>
                    <span className="inline-flex items-center gap-1 text-xs text-green-400 mt-1">
                      <Shield size={12} /> Verified Community
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SAFETY */}
        <section id="safety" className="py-24 bg-primary/5 border-y border-primary/10">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Safety First, Always.</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">We've built multiple layers of security so you can travel with complete peace of mind.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Verified Students Only", desc: "Every user must verify their student ID, college email, and phone number before accessing rides." },
                { title: "Women Only Rides", desc: "Option to request or offer rides exclusively for female students." },
                { title: "SOS Emergency Support", desc: "One-tap emergency button sharing your live location with trusted contacts and authorities." },
                { title: "Trusted Contacts", desc: "Automatically share your ride details and ETA with pre-approved family and friends." },
                { title: "Real-time Tracking", desc: "Track rides in real-time within the app from pickup to drop-off." },
                { title: "Community Moderation", desc: "Rate and review co-travelers to maintain a high-quality, respectful community." }
              ].map((feature, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 flex gap-4 items-start">
                  <div className="mt-1 text-primary"><Shield size={20} /></div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EVENTS */}
        <section id="events" className="py-24">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <div className="mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Rides for Every Occasion</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Don't stress about transport for important college events.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {['Exam Ride Pools', 'Placement Transportation', 'Workshop Travel', 'Hackathon Travel', 'College Fest Travel'].map((event, i) => (
                <div key={i} className="px-6 py-4 rounded-full border border-primary/20 bg-primary/5 text-foreground font-medium flex items-center gap-2">
                  <Calendar size={18} className="text-primary" />
                  {event}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="py-24 bg-card/30">
          <div className="container px-4 md:px-6 mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-12">
              We believe students shouldn't have to choose between affordability and safety. ChaloTogether was built to create a sustainable, verified network where Chennai college students can commute together, build community, and reduce traffic congestion.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-black text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Verified</div>
              </div>
              <div>
                <div className="text-4xl font-black text-primary mb-2">10+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Colleges</div>
              </div>
              <div>
                <div className="text-4xl font-black text-primary mb-2">₹0</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Platform Fee</div>
              </div>
              <div>
                <div className="text-4xl font-black text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Support</div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
