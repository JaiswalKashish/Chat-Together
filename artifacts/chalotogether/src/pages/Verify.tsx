import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, Upload, Mail, Smartphone, ArrowRight, Copy, Info } from "lucide-react";
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
} from "@workspace/api-client-react";

export function Verify() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeStep, setActiveStep] = useState(1);
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [emailToken, setEmailToken] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [demoEmailCode, setDemoEmailCode] = useState<string | null>(null);
  const [demoPhoneCode, setDemoPhoneCode] = useState<string | null>(null);

  const submitIdMutation = useSubmitStudentId();
  const resendEmailMutation = useResendVerification();
  const verifyEmailMutation = useVerifyEmail();
  const sendOtpMutation = useSendPhoneOtp();
  const verifyPhoneMutation = useVerifyPhone();

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
          toast({ title: "ID Submitted", description: "Your student ID has been received." });
          setActiveStep(2);
        },
        onError: (err: unknown) => {
          const message = (err as { data?: { error?: string } })?.data?.error ?? "Error submitting ID";
          toast({ title: message, variant: "destructive" });
        },
      }
    );
  };

  const handleResendEmail = () => {
    resendEmailMutation.mutate(
      { data: { email: user.email } },
      {
        onSuccess: (data: unknown) => {
          const result = data as { demoToken?: string };
          if (result?.demoToken) {
            setDemoEmailCode(result.demoToken);
            setEmailToken(result.demoToken);
            toast({ title: "Verification code ready", description: "Code has been filled in automatically below." });
          } else {
            toast({ title: "Verification email sent!" });
          }
        },
      }
    );
  };

  const handleVerifyEmail = () => {
    verifyEmailMutation.mutate(
      { data: { token: emailToken } },
      {
        onSuccess: () => {
          toast({ title: "Email verified!" });
          setDemoEmailCode(null);
          setActiveStep(3);
        },
        onError: () => toast({ title: "Invalid code. Try requesting a new one.", variant: "destructive" }),
      }
    );
  };

  const handleSendOtp = () => {
    sendOtpMutation.mutate(
      { data: { phone: user.phone } },
      {
        onSuccess: (data: unknown) => {
          const result = data as { demoOtp?: string };
          if (result?.demoOtp) {
            setDemoPhoneCode(result.demoOtp);
            setPhoneOtp(result.demoOtp);
            toast({ title: "OTP ready", description: "OTP has been filled in automatically below." });
          } else {
            toast({ title: "OTP sent to " + user.phone });
          }
        },
      }
    );
  };

  const handleVerifyPhone = () => {
    verifyPhoneMutation.mutate(
      { data: { phone: user.phone, otp: phoneOtp } },
      {
        onSuccess: () => {
          toast({ title: "Phone verified! You're all set." });
          setLocation("/dashboard");
        },
        onError: () => toast({ title: "Invalid OTP. Try requesting a new one.", variant: "destructive" }),
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const stepClass = (step: number) =>
    `bg-card border rounded-2xl p-6 transition-all ${
      activeStep === step
        ? "border-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]"
        : activeStep > step
          ? "border-border"
          : "border-border opacity-50 pointer-events-none"
    }`;

  const stepIcon = (step: number, icon: React.ReactNode) => (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${
        activeStep > step
          ? "bg-green-500/20 text-green-500"
          : activeStep === step
            ? "bg-primary/20 text-primary"
            : "bg-secondary text-muted-foreground"
      }`}
    >
      {activeStep > step ? <Check size={20} /> : icon}
    </div>
  );

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

        {/* Demo mode notice */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-sm">
          <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-200/80">
            <span className="font-semibold text-amber-300">Demo mode:</span> Email and SMS services are not yet
            configured. Verification codes will appear directly on screen so you can complete the flow.
          </p>
        </div>

        <div className="space-y-6">
          {/* STEP 1: Student ID */}
          <div className={stepClass(1)}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {stepIcon(1, <span className="font-bold">1</span>)}
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
                    data-testid="input-student-id"
                  />
                </div>
                {studentIdFile && (
                  <p className="text-sm text-muted-foreground mb-3 text-center">
                    Selected: <span className="text-foreground font-medium">{studentIdFile.name}</span>
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={handleIdSubmit}
                  disabled={!studentIdFile || submitIdMutation.isPending}
                  data-testid="button-submit-id"
                >
                  {submitIdMutation.isPending ? "Submitting..." : "Submit ID for Review"}
                </Button>
              </motion.div>
            )}
          </div>

          {/* STEP 2: Email */}
          <div className={stepClass(2)}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {stepIcon(2, <Mail size={20} />)}
                <h3 className="text-xl font-semibold">Verify Email</h3>
              </div>
              {activeStep > 2 && <span className="text-sm font-medium text-green-500">Completed</span>}
            </div>

            {activeStep === 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  Verification code for{" "}
                  <span className="font-semibold text-foreground">{user.email}</span>
                </p>

                {demoEmailCode && (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-primary/70 mb-0.5 font-medium uppercase tracking-wide">Your verification code</p>
                      <p className="font-mono text-lg font-bold text-primary tracking-widest">{demoEmailCode}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(demoEmailCode)}
                      className="text-primary hover:text-primary"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Enter verification code"
                    value={emailToken}
                    onChange={(e) => setEmailToken(e.target.value)}
                    data-testid="input-email-token"
                  />
                  <Button
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={resendEmailMutation.isPending}
                    data-testid="button-resend-email"
                  >
                    {demoEmailCode ? "Regenerate" : "Get Code"}
                  </Button>
                </div>
                <Button
                  className="w-full"
                  onClick={handleVerifyEmail}
                  disabled={!emailToken || verifyEmailMutation.isPending}
                  data-testid="button-verify-email"
                >
                  {verifyEmailMutation.isPending ? "Verifying..." : "Verify Email"}
                </Button>
              </motion.div>
            )}
          </div>

          {/* STEP 3: Phone */}
          <div className={stepClass(3)}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {stepIcon(3, <Smartphone size={20} />)}
                <h3 className="text-xl font-semibold">Verify Phone</h3>
              </div>
            </div>

            {activeStep === 3 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  OTP for{" "}
                  <span className="font-semibold text-foreground">{user.phone}</span>
                </p>

                {demoPhoneCode && (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-primary/70 mb-0.5 font-medium uppercase tracking-wide">Your OTP</p>
                      <p className="font-mono text-lg font-bold text-primary tracking-widest">{demoPhoneCode}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(demoPhoneCode)}
                      className="text-primary hover:text-primary"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Enter OTP"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    data-testid="input-phone-otp"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSendOtp}
                    disabled={sendOtpMutation.isPending}
                    data-testid="button-send-otp"
                  >
                    {demoPhoneCode ? "Regenerate" : "Send OTP"}
                  </Button>
                </div>
                <Button
                  className="w-full"
                  onClick={handleVerifyPhone}
                  disabled={!phoneOtp || verifyPhoneMutation.isPending}
                  data-testid="button-verify-phone"
                >
                  {verifyPhoneMutation.isPending ? "Verifying..." : "Complete Verification"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {activeStep < 3 && (
          <div className="mt-8 text-center">
            <Button variant="link" className="text-muted-foreground" onClick={() => setLocation("/dashboard")}>
              Skip for now (limited access)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
