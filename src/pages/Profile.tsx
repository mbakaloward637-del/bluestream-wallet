import { useState } from "react";
import { ArrowLeft, User, Phone, Mail, Shield, Camera, Lock, ChevronRight, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Change PIN state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  // Update Info state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);

  if (loading) return <div className="page-container flex items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  if (!user) return null;

  const openEditInfo = () => {
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditPhone(user.phone);
    setEditCity("");
    setEditAddress("");
    setActiveModal("info");
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 8) { toast.error("Minimum 8 characters"); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated!");
    setActiveModal(null);
    setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
  };

  const handleChangePin = async () => {
    if (newPin !== confirmNewPin) { toast.error("PINs don't match"); return; }
    if (newPin.length < 4) { toast.error("PIN must be 4-6 digits"); return; }
    setPinLoading(true);
    const { data, error } = await supabase.functions.invoke("set-wallet-pin", {
      body: { pin: newPin, current_pin: currentPin || undefined },
    });
    setPinLoading(false);
    if (error || data?.error) { toast.error(data?.error || "Failed to update PIN"); return; }
    toast.success("Wallet PIN updated!");
    setActiveModal(null);
    setCurrentPin(""); setNewPin(""); setConfirmNewPin("");
  };

  const handleUpdateInfo = async () => {
    setInfoLoading(true);
    const updates: Record<string, string> = {};
    if (editFirstName !== user.firstName) updates.first_name = editFirstName;
    if (editLastName !== user.lastName) updates.last_name = editLastName;
    if (editPhone !== user.phone) updates.phone = editPhone;
    if (editCity) updates.city = editCity;
    if (editAddress) updates.address = editAddress;

    if (Object.keys(updates).length === 0) { toast.info("No changes"); setInfoLoading(false); return; }

    const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
    setInfoLoading(false);
    if (error) { toast.error("Update failed"); return; }
    await refreshUser();
    toast.success("Profile updated!");
    setActiveModal(null);
  };

  const menuItems = [
    { label: "Update Personal Info", desc: "Name, phone, address", icon: User, action: openEditInfo },
    { label: "Change Password", desc: "Update your account password", icon: Lock, action: () => setActiveModal("password") },
    { label: "Change Wallet PIN", desc: "Update your transaction PIN", icon: Shield, action: () => setActiveModal("pin") },
  ];

  const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0 mb-6">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={18} className="text-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mb-3">{user.avatarInitials}</div>
          <h2 className="text-lg font-bold text-foreground">{user.firstName} {user.lastName}</h2>
          <p className="text-sm text-muted-foreground">{user.walletNumber}</p>
        </div>

        <div className="section-card space-y-3 mb-6">
          {[
            { icon: Phone, label: "Phone", value: user.phone },
            { icon: Mail, label: "Email", value: user.email },
            { icon: Shield, label: "Verification", value: user.kycStatus },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><row.icon size={16} className="text-primary" /></div>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">{row.label}</p>
                <p className="text-sm font-medium text-foreground capitalize">{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => (
            <button key={item.label} onClick={item.action} className="section-card w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><item.icon size={18} className="text-primary" /></div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Change Password Modal */}
      {activeModal === "password" && (
        <Modal title="Change Password" onClose={() => setActiveModal(null)}>
          <input type="password" placeholder="New Password" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <input type="password" placeholder="Confirm New Password" className="input-field" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
          <button onClick={handleChangePassword} disabled={pwLoading} className="btn-primary flex items-center justify-center gap-2 w-full">
            {pwLoading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
          </button>
        </Modal>
      )}

      {/* Change PIN Modal */}
      {activeModal === "pin" && (
        <Modal title="Change Wallet PIN" onClose={() => setActiveModal(null)}>
          <input type="password" inputMode="numeric" maxLength={6} placeholder="Current PIN" className="input-field text-center tracking-[0.5em]"
            value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))} />
          <input type="password" inputMode="numeric" maxLength={6} placeholder="New PIN (4-6 digits)" className="input-field text-center tracking-[0.5em]"
            value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} />
          <input type="password" inputMode="numeric" maxLength={6} placeholder="Confirm New PIN" className="input-field text-center tracking-[0.5em]"
            value={confirmNewPin} onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ""))} />
          <button onClick={handleChangePin} disabled={pinLoading} className="btn-primary flex items-center justify-center gap-2 w-full">
            {pinLoading ? <Loader2 size={16} className="animate-spin" /> : "Update PIN"}
          </button>
        </Modal>
      )}

      {/* Update Info Modal */}
      {activeModal === "info" && (
        <Modal title="Update Personal Info" onClose={() => setActiveModal(null)}>
          <input placeholder="First Name" className="input-field" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
          <input placeholder="Last Name" className="input-field" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
          <input placeholder="Phone" className="input-field" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
          <input placeholder="City" className="input-field" value={editCity} onChange={(e) => setEditCity(e.target.value)} />
          <input placeholder="Address" className="input-field" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
          <button onClick={handleUpdateInfo} disabled={infoLoading} className="btn-primary flex items-center justify-center gap-2 w-full">
            {infoLoading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
          </button>
        </Modal>
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;
