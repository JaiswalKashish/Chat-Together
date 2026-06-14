import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useRegisterUser, useListColleges } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  college: z.string().min(1, "College is required"),
  department: z.string().min(1, "Department is required"),
  year: z.string().min(1, "Year is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+91[0-9]{10}$/, "Phone must be in format +91XXXXXXXXXX"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof registerSchema>;

export function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegisterUser();
  const { data: collegesData } = useListColleges();

  const colleges = collegesData && collegesData.length > 0
    ? collegesData.map(c => c.name)
    : hardcodedColleges;

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      college: "",
      department: "",
      year: "",
      email: "",
      phone: "+91",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
    mode: "onChange",
  });

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ["fullName", "college", "department", "year"];
    if (step === 2) fieldsToValidate = ["email", "phone", "password", "confirmPassword"];

    const isStepValid = await form.trigger(fieldsToValidate as any);
    if (isStepValid) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    setStep(s => s - 1);
  };

  const onSubmit = (values: FormValues) => {
    registerMutation.mutate({
      data: {
        fullName: values.fullName,
        college: values.college,
        department: values.department,
        year: values.year,
        email: values.email,
        phone: values.phone,
        password: values.password,
      }
    }, {
      onSuccess: (res) => {
        login(res.token, res.user);
        toast({
          title: "Registration successful!",
          description: "Please verify your student identity.",
        });
        setLocation("/verify");
      },
      onError: (err: any) => {
        toast({
          title: "Registration Failed",
          description: err.data?.error || "Could not register",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-12 pb-24 px-4 items-center">
      <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl mb-12 tracking-tight">
        <span>🚗</span>
        <span className="bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
          ChaloTogether
        </span>
      </Link>

      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-secondary -translate-y-1/2 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: "33%" }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="relative flex justify-between">
            {[1, 2, 3].map((num) => (
              <div 
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-4 border-background transition-colors ${
                  step >= num ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Personal Info</h2>
                      <p className="text-muted-foreground text-sm mb-6">Tell us about yourself and your college.</p>
                    </div>

                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="college" render={({ field }) => (
                      <FormItem>
                        <FormLabel>College</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your college" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {colleges.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="department" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl><Input placeholder="CSE, ECE, etc." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="year" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1st Year">1st Year</SelectItem>
                              <SelectItem value="2nd Year">2nd Year</SelectItem>
                              <SelectItem value="3rd Year">3rd Year</SelectItem>
                              <SelectItem value="4th Year">4th Year</SelectItem>
                              <SelectItem value="PG">PG</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <Button type="button" onClick={nextStep} className="w-full mt-4">
                      Next <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Account Details</h2>
                      <p className="text-muted-foreground text-sm mb-6">Set up your login credentials.</p>
                    </div>

                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>College or Personal Email</FormLabel>
                        <FormControl><Input type="email" placeholder="student@college.edu" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="+91XXXXXXXXXX" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" className="pr-10" data-testid="input-password" {...field} />
                            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password" className="pr-10" data-testid="input-confirm-password" {...field} />
                            <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="flex gap-4 mt-4">
                      <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button type="button" onClick={nextStep} className="flex-1">
                        Next <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Confirm & Submit</h2>
                      <p className="text-muted-foreground text-sm mb-6">Review your details before creating your account.</p>
                    </div>

                    <div className="bg-secondary/30 p-4 rounded-xl space-y-2 text-sm">
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{form.getValues().fullName}</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">College</span>
                        <span className="font-medium text-right max-w-[200px] truncate">{form.getValues().college}</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">Department</span>
                        <span className="font-medium">{form.getValues().department} ({form.getValues().year})</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium">{form.getValues().email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium">{form.getValues().phone}</span>
                      </div>
                    </div>

                    <FormField control={form.control} name="agreeTerms" render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I agree to the Terms and Privacy Policy</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            ChaloTogether is for verified students only. Any fraudulent activity will lead to an immediate ban.
                          </p>
                        </div>
                      </FormItem>
                    )} />

                    <div className="flex gap-4 mt-4">
                      <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button type="submit" disabled={registerMutation.isPending} className="flex-1">
                        {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
