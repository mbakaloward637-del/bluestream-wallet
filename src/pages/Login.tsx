import { useState } from "react";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      toast.success("Welcome back!");
      // Role-based redirect handled after user data loads
    } else {
      toast.error("Invalid credentials. Check your email and password.");
    }
  };

  // Redirect after auth loads
  const { user, isAdmin, isSuperAdmin } = useAuth();
  if (user && !authLoading) {
    const target = isSuperAdmin ? "/admin/super-dashboard" : isAdmin ? "/admin/dashboard" : "/dashboard";
    navigate(target, { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <span className="text-xl font-extrabold text-primary-foreground">A</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your digital wallet</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label-text flex items-center gap-1"><Mail size={12}/>Email</label>
            <input type="email" className="input-field" placeholder="james@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label-text flex items-center gap-1"><Lock size={12}/>Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>

          <button className="text-xs text-primary font-medium">Forgot password?</button>

          <button onClick={handleLogin} disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <button onClick={() => navigate("/register")} className="text-primary font-semibold">Create Account</button>
        </p>
      </div>
    </div>
  );
};

export default Login;
