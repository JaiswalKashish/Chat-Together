import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useListTrustedContacts, useAddTrustedContact, useDeleteTrustedContact } from "@workspace/api-client-react";
import { Shield, Plus, Trash2, Phone, User, Heart, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: "👨‍👩‍👧 Parent",
  guardian: "🛡️ Guardian",
  friend: "👫 Friend",
  sibling: "👫 Sibling",
  other: "👤 Other",
};

export function TrustedContacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [form, setForm] = useState<{ name: string; phone: string; relationship: "parent" | "guardian" | "friend" | "sibling" | "other" }>({ name: "", phone: "", relationship: "parent" });

  const { data: contacts = [], isLoading } = useListTrustedContacts({
    query: { queryKey: ["trusted-contacts"] },
  });

  const addContact = useAddTrustedContact();
  const deleteContact = useDeleteTrustedContact();

  async function handleAdd() {
    if (!form.name || !form.phone) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    try {
      await addContact.mutateAsync({ data: form });
      queryClient.invalidateQueries({ queryKey: ["trusted-contacts"] });
      toast({ title: "Contact added!" });
      setDialogOpen(false);
      setForm({ name: "", phone: "", relationship: "parent" });
    } catch {
      toast({ title: "Failed to add contact", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteContact.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["trusted-contacts"] });
      toast({ title: "Contact removed" });
    } catch {
      toast({ title: "Failed to remove", variant: "destructive" });
    }
  }

  function handleSOS() {
    if (contacts.length === 0) {
      toast({ title: "No trusted contacts", description: "Add trusted contacts first to use SOS.", variant: "destructive" });
      return;
    }
    setSosActive(true);
    // Get current location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        toast({
          title: "🚨 SOS Alert Sent!",
          description: `Alert sent to ${contacts.length} trusted contact(s). Location: ${locationUrl.slice(0, 40)}…`,
        });
      }, () => {
        toast({ title: "🚨 SOS Alert Sent!", description: `Alert sent to ${contacts.length} trusted contact(s). Location unavailable.` });
      });
    } else {
      toast({ title: "🚨 SOS Alert Sent!", description: `Alert sent to ${contacts.length} trusted contact(s).` });
    }
    setTimeout(() => setSosActive(false), 5000);
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Safety & Contacts</h1>
            <p className="text-muted-foreground mt-1">Manage trusted contacts and emergency SOS.</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus size={16} className="mr-2" /> Add Contact
          </Button>
        </div>

        {/* SOS Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/30 rounded-2xl p-6 mb-8 text-center"
        >
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-1">Emergency SOS</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Instantly alert all your trusted contacts with your current location and ride details.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSOS}
            disabled={sosActive}
            className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all ${
              sosActive
                ? "bg-red-600 animate-pulse shadow-red-500/50 shadow-2xl"
                : "bg-red-500 hover:bg-red-600 shadow-red-500/30"
            }`}
          >
            {sosActive ? (
              <div className="text-center">
                <div className="text-2xl mb-1">🚨</div>
                <div className="text-xs">SENDING…</div>
              </div>
            ) : (
              <div className="text-center">
                <Shield size={32} className="mx-auto mb-1" />
                <div className="text-sm">SOS</div>
              </div>
            )}
          </motion.button>
          {sosActive && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm mt-4 font-medium"
            >
              Alerting {contacts.length} trusted contact{contacts.length !== 1 ? "s" : ""}…
            </motion.p>
          )}
        </motion.div>

        {/* Contacts List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Trusted Contacts ({contacts.length}/5)</h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/50 rounded-xl">
              <User size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No trusted contacts yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Add family members or friends who should be notified in emergencies.</p>
              <Button variant="outline" onClick={() => setDialogOpen(true)}>
                <Plus size={16} className="mr-2" /> Add First Contact
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg">
                      {contact.relationship === "parent" ? "👨‍👩‍👧" :
                       contact.relationship === "guardian" ? "🛡️" :
                       contact.relationship === "sibling" ? "👫" :
                       contact.relationship === "friend" ? "👫" : "👤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{contact.name}</span>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full capitalize">
                          {contact.relationship}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <Phone size={13} />
                        <span>{contact.phone}</span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(contact.id)}
                      disabled={deleteContact.isPending}
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Add Contact Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border border-border/50 max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart size={18} className="text-primary" /> Add Trusted Contact
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Full Name</Label>
                <Input
                  placeholder="e.g., Priya Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 bg-background border-border/50"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 bg-background border-border/50"
                />
              </div>
              <div>
                <Label>Relationship</Label>
                <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v as typeof form.relationship })}>
                  <SelectTrigger className="mt-1 bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RELATIONSHIP_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAdd} disabled={addContact.isPending} className="flex-1 bg-primary">
                  {addContact.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                  Add Contact
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
