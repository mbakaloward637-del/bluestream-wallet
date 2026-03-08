import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth, demoUsers } from "@/context/AuthContext";
import { toast } from "sonner";

const roleColors = {
  user: "from-accent to-primary",
  admin: "from-warning to-primary",
  superadmin: "from-destructive to-primary",
};

const roleLabels = {
  user: "User",
  admin: "Admin",
  superadmin: "Super Admin",
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (login(email, password)) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      toast.error("Invalid credentials. Try a demo account below.");
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    if (login(demoEmail, "demo")) {
      toast.success("Logged in as demo user!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-5 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <h1 className="text-3xl font-extrabold gradient-text">AbanRemit</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your digital wallet</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Mail size={12}/>Email</label>
            <input type="email" className="input-glass w-full" placeholder="james@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Lock size={12}/>Password</label>
            <input type="password" className="input-glass w-full" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="text-xs text-primary font-semibold">Forgot password?</button>

          <button
            onClick={handleLogin}
            className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground flex items-center justify-center gap-2"
          >
            Sign In
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Demo Accounts Section */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground">Quick Demo Login</p>
          </div>
          <div className="space-y-2">
            {demoUsers.map((u) => (
              <motion.button
                key={u.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleDemoLogin(u.email)}
                className="glass-card-hover w-full flex items-center gap-3 rounded-xl p-3 text-left"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${roleColors[u.role]} text-xs font-bold text-primary-foreground`}>
                  {u.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-muted-foreground">{u.email}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                  u.role === "superadmin" ? "bg-destructive/10 text-destructive" :
                  u.role === "admin" ? "bg-warning/10 text-warning" :
                  "bg-primary/10 text-primary"
                }`}>
                  {roleLabels[u.role]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <button onClick={() => navigate("/register")} className="text-primary font-semibold">Create Account</button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
