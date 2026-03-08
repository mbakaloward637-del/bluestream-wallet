import { ArrowLeft, User, Phone, Mail, Shield, Camera, Lock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  const menuItems = [
    { label: "Update Personal Info", desc: "Name, address, date of birth", icon: User },
    { label: "Change Password", desc: "Update your account password", icon: Lock },
    { label: "Change Wallet PIN", desc: "Update your transaction PIN", icon: Shield },
    { label: "Upload New ID", desc: "Update identity documents", icon: Camera },
    { label: "Upload Profile Photo", desc: "Set your profile picture", icon: Camera },
  ];

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0 mb-6">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mb-3">
            {user.avatarInitials}
          </div>
          <h2 className="text-lg font-bold text-foreground">{user.firstName} {user.lastName}</h2>
          <p className="text-sm text-muted-foreground">{user.walletNumber}</p>
        </div>

        {/* Info Card */}
        <div className="section-card space-y-3 mb-6">
          {[
            { icon: Phone, label: "Phone", value: user.phone },
            { icon: Mail, label: "Email", value: user.email },
            { icon: Shield, label: "Verification", value: user.kycStatus },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <row.icon size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">{row.label}</p>
                <p className="text-sm font-medium text-foreground capitalize">{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button key={item.label} className="section-card w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <item.icon size={18} className="text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
