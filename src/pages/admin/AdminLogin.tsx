import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Mail, Lock, Shield, ArrowRight, KeyRound } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleCredentials = () => {
    if (locked) {
      toast.error("Account locked. Too many failed attempts. Try again later.");
      return;
    }

    const found = login(email, password);
    if (found) {
      setStep("otp");
      toast.info("OTP sent to your registered device");
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLocked(true);
        toast.error("Account locked after 5 failed attempts. Contact Super Admin.");
      } else {
        toast.error(`Invalid credentials. ${5 - newAttempts} attempts remaining.`);
      }
    }
  };

  const handleOtp = () => {
    if (otp.length >= 4) {
      const { user } = useAuth();
      toast.success("Authentication successful");
      navigate(user?.role === "superadmin" ? "/admin/super-dashboard" : "/admin/dashboard");
    } else {
      toast.error("Invalid OTP. Enter the code sent to your device.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Shield size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">AbanRemit Administration Portal</p>
        </div>

        {locked && (
          <div className="section-card border-destructive/30 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 shrink-0">
              <Shield size={18} className="text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">Account Locked</p>
              <p className="text-xs text-muted-foreground mt-0.5">Too many failed login attempts. Contact your Super Admin to unlock.</p>
            </div>
          </div>
        )}

        {step === "credentials" && (
          <div className="space-y-4">
            <div>
              <label className="label-text flex items-center gap-1"><Mail size={12}/>Admin Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="admin@abanremit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={locked}
              />
            </div>
            <div>
              <label className="label-text flex items-center gap-1"><Lock size={12}/>Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={locked}
              />
            </div>

            <button
              onClick={handleCredentials}
              disabled={locked || !email || !password}
              className="btn-primary flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={16} />
            </button>

            {attempts > 0 && !locked && (
              <p className="text-center text-xs text-warning font-medium">{5 - attempts} login attempts remaining</p>
            )}
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <div className="section-card text-center py-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <KeyRound size={24} className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground mt-1">Enter the verification code sent to your device</p>
            </div>

            <div>
              <label className="label-text">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <button
              onClick={handleOtp}
              disabled={otp.length < 4}
              className="btn-primary flex items-center justify-center gap-2"
            >
              Verify & Login <Shield size={16} />
            </button>

            <button
              onClick={() => { setStep("credentials"); setOtp(""); }}
              className="w-full text-center text-xs text-primary font-medium"
            >
              Back to login
            </button>
          </div>
        )}

        <div className="section-card">
          <p className="text-[10px] text-muted-foreground text-center">
            Demo: Use <span className="font-semibold text-foreground">admin@demo.com</span> or <span className="font-semibold text-foreground">super@demo.com</span> with any password. Enter any 4+ digit OTP.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
