import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, Upload, Mail, Smartphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSubmitStudentId,
  useResendVerification,
  useVerifyEmail,
  useSendPhoneOtp,
  useVerifyPhone,
  useGetVerificationStatus
} from "@workspace/api-client-react";

export function Verify() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeStep, setActiveStep] = useState(1);
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [emailToken, setEmailToken] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");

  const submitIdMutation = useSubmitStudentId();
  const resendEmailMutation = useResendVerification();
  const verifyEmailMutation = useVerifyEmail();
  const sendOtpMutation = useSendPhoneOtp();
  const verifyPhoneMutation = useVerifyPhone();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  if (!user) return null;

  const handleIdSubmit = () => {
    if (!studentIdFile) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }
    submitIdMutation.mutate(
      { data: { studentIdImageUrl: studentIdFile.name, college: user.college } },
      {
        onSuccess: () => {
          toast({ title: "ID Submitted", description: "Your student ID is under review." });
          setActiveStep(2);
        },
        onError: () => toast({ title: "Error submitting ID", variant: "destructive" })
      }
    );
  };

  const handleResendEmail = () => {
    resendEmailMutation.mutate(
      { data: { email: user.email } },
      { onSuccess: () => toast({ title: "Verification email sent!" }) }
    );
  };

  const handleVerifyEmail = () => {
    verifyEmailMutation.mutate(
      { data: { token: emailToken } },
      {
        onSuccess: () => {
          toast({ title: "Email verified successfully!" });
          setActiveStep(3);
        },
        onError: () => toast({ title: "Invalid token", variant: "destructive" })
      }
    );
  };

  const handleSendOtp = () => {
    sendOtpMutation.mutate(
      { data: { phone: user.phone } },
      { onSuccess: () => toast({ title: "OTP sent to " + user.phone }) }
    );
  };

  const handleVerifyPhone = () => {
    verifyPhoneMutation.mutate(
      { data: { phone: user.phone, otp: phoneOtp } },
      {
        onSuccess: () => {
          toast({ title: "Phone verified successfully!" });
          setLocation("/dashboard");
        },
        onError: () => toast({ title: "Invalid OTP", variant: "destructive" })
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-12 pb-24 px-4 items-center">
      <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl mb-12 tracking-tight">
        <span>🚗</span>
        <span className="bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
          ChaloTogether
        </span>
      </Link>

      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Verify Your Student Identity</h1>
          <p className="text-muted-foreground">Complete these steps to access the network safely.</p>
        </div>

        <div className="space-y-6">
          {/* STEP 1: Student ID */}
          <div className={`bg-card border ${activeStep === 1 ? 'border-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-border'} rounded-2xl p-6 transition-all`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep > 1 ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                  {activeStep > 1 ? <Check size={20} /> : <span className="font-bold">1</span>}
                </div>
                <h3 className="text-xl font-semibold">Upload Student ID</h3>
              </div>
              {activeStep > 1 && <span className="text-sm font-medium text-green-500">Completed</span>}
            </div>

            {activeStep === 1 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-secondary/30 mb-4 hover:border-primary/50 transition-colors">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm font-medium mb-1">Click to upload your College ID card</p>
                  <p className="text-xs text-muted-foreground mb-4">PNG, JPG up to 5MB</p>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    className="max-w-[250px] mx-auto"
                    onChange={(e) => setStudentIdFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button className="w-full" onClick={handleIdSubmit} disabled={!studentIdFile || submitIdMutation.isPending}>
                  {submitIdMutation.isPending ? "Submitting..." : "Submit ID"}
                </Button>
              </motion.div>
            )}
          </div>

          {/* STEP 2: Email */}
          <div className={`bg-card border ${activeStep === 2 ? 'border-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-border'} rounded-2xl p-6 transition-all opacity-${activeStep >= 2 ? '100' : '50 pointer-events-none'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep > 2 ? 'bg-green-500/20 text-green-500' : (activeStep === 2 ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground')}`}>
                  {activeStep > 2 ? <Check size={20} /> : <Mail size={20} />}
                </div>
                <h3 className="text-xl font-semibold">Verify Email</h3>
              </div>
              {activeStep > 2 && <span className="text-sm font-medium text-green-500">Completed</span>}
            </div>

            {activeStep === 2 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                <p className="text-sm text-muted-foreground">We sent a verification code to <span className="font-semibold text-foreground">{user.email}</span></p>
                <div className="flex gap-2">
                  <Input placeholder="Enter 6-digit code" value={emailToken} onChange={e => setEmailToken(e.target.value)} />
                  <Button variant="outline" onClick={handleResendEmail} disabled={resendEmailMutation.isPending}>Resend</Button>
                </div>
                <Button className="w-full" onClick={handleVerifyEmail} disabled={!emailToken || verifyEmailMutation.isPending}>
                  Verify Email
                </Button>
              </motion.div>
            )}
          </div>

          {/* STEP 3: Phone */}
          <div className={`bg-card border ${activeStep === 3 ? 'border-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-border'} rounded-2xl p-6 transition-all opacity-${activeStep >= 3 ? '100' : '50 pointer-events-none'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep > 3 ? 'bg-green-500/20 text-green-500' : (activeStep === 3 ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground')}`}>
                  {activeStep > 3 ? <Check size={20} /> : <Smartphone size={20} />}
                </div>
                <h3 className="text-xl font-semibold">Verify Phone</h3>
              </div>
            </div>

            {activeStep === 3 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                <p className="text-sm text-muted-foreground">Verify your phone number <span className="font-semibold text-foreground">{user.phone}</span> for ride coordination.</p>
                <div className="flex gap-2">
                  <Input placeholder="Enter OTP" value={phoneOtp} onChange={e => setPhoneOtp(e.target.value)} />
                  <Button variant="outline" onClick={handleSendOtp} disabled={sendOtpMutation.isPending}>Send OTP</Button>
                </div>
                <Button className="w-full" onClick={handleVerifyPhone} disabled={!phoneOtp || verifyPhoneMutation.isPending}>
                  Complete Verification <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {activeStep < 3 && (
           <div className="mt-8 text-center">
             <Button variant="link" className="text-muted-foreground" onClick={() => setLocation("/dashboard")}>
               Skip for now (Limited access)
             </Button>
           </div>
        )}
      </div>
    </div>
  );
}
