import { useState } from "react";
import { Mail, Lock, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth, demoUsers } from "@/context/AuthContext";
import { toast } from "sonner";

const roleLabels = { user: "User", admin: "Admin", superadmin: "Super Admin" };

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (login(email, password)) {
      const found = demoUsers.find((u) => u.email === email);
      toast.success("Welcome back!");
      navigate(found?.role === "superadmin" ? "/admin/super-dashboard" : found?.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } else {
      toast.error("Invalid credentials. Try a demo account below.");
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    if (login(demoEmail, "demo")) {
      const found = demoUsers.find((u) => u.email === demoEmail);
      toast.success("Logged in as demo user!");
      navigate(found?.role === "superadmin" ? "/admin/super-dashboard" : found?.role === "admin" ? "/admin/dashboard" : "/dashboard");
    }
  };

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
            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="text-xs text-primary font-medium">Forgot password?</button>

          <button onClick={handleLogin} className="btn-primary flex items-center justify-center gap-2">
            Sign In <ArrowRight size={16} />
          </button>
        </div>

        {/* Demo Accounts */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Quick Demo Login</p>
          </div>
          <div className="space-y-2">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => handleDemoLogin(u.email)}
                className="section-card w-full flex items-center gap-3 text-left hover:bg-secondary/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {u.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-muted-foreground">{u.email}</p>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
                  u.role === "superadmin" ? "bg-destructive/10 text-destructive" :
                  u.role === "admin" ? "bg-warning/10 text-warning" :
                  "bg-primary/10 text-primary"
                }`}>
                  {roleLabels[u.role]}
                </span>
              </button>
            ))}
          </div>
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
