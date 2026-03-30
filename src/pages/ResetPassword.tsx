import { useState, useEffect } from "react";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/services/api";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // If already in a session (user clicked link), allow reset
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password || !confirmPassword) { toast.error("Please fill in both fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }

    setLoading(true);
    try {
      await api.auth.resetPassword({ password });
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10"><CheckCircle size={32} className="text-success" /></div>
          <h1 className="text-xl font-bold text-foreground">Password Updated!</h1>
          <p className="text-sm text-muted-foreground">Your password has been reset successfully.</p>
          <button onClick={() => navigate("/login")} className="btn-primary">Go to Login</button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your new password below</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label-text flex items-center gap-1"><Lock size={12}/>New Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label-text flex items-center gap-1"><Lock size={12}/>Confirm Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleReset()} />
          </div>
          <button onClick={handleReset} disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
