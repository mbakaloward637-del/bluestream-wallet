import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Smartphone, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const networks = [
  { id: "safaricom", name: "Safaricom", color: "from-[hsl(142,71%,45%)] to-[hsl(142,60%,35%)]", prefix: "+254 7" },
  { id: "airtel", name: "Airtel", color: "from-[hsl(0,84%,60%)] to-[hsl(0,70%,45%)]", prefix: "+254 7" },
  { id: "telkom", name: "Telkom", color: "from-[hsl(217,91%,60%)] to-[hsl(199,89%,48%)]", prefix: "+254 7" },
];

const amounts = [10, 20, 50, 100, 200, 500, 1000, 2500];

const BuyAirtime = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [phone, setPhone] = useState(user?.phone || "");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePurchase = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      toast.success(`KES ${amount} airtime sent to ${phone}`);
    }, 2000);
  };

  if (done) {
    return (
      <div className="min-h-screen gradient-hero pb-24 flex flex-col">
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate("/dashboard")} className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
              <ArrowLeft size={18} className="text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Buy Airtime</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <Check size={40} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Airtime Sent!</h2>
            <p className="mt-1 text-sm text-muted-foreground">KES {amount} to {phone}</p>
            <p className="mt-0.5 text-xs text-muted-foreground capitalize">{selectedNetwork}</p>
            <button onClick={() => navigate("/dashboard")} className="mt-6 btn-primary-glow rounded-xl px-8 py-3 text-sm font-bold text-primary-foreground">
              Done
            </button>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Buy Airtime</h1>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {["Network", "Amount", "Confirm"].map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${i < step ? "gradient-primary" : "bg-muted"}`} />
              <p className={`mt-1 text-[10px] font-semibold ${i < step ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
            </div>
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Select Network</p>
            {networks.map((n) => (
              <motion.button
                key={n.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedNetwork(n.id); setStep(2); }}
                className={`glass-card-hover w-full flex items-center gap-4 rounded-2xl p-4 ${
                  selectedNetwork === n.id ? "border-primary/50" : ""
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${n.color}`}>
                  <Smartphone size={22} className="text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">{n.name}</p>
                  <p className="text-xs text-muted-foreground">Kenya • Mobile Airtime</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-glass w-full" placeholder="+254 7XX XXX XXX" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Amount (KES)</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {amounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`glass-card rounded-xl py-3 text-xs font-bold transition-all ${
                      amount === String(a) ? "gradient-primary text-primary-foreground" : "text-foreground/80 hover:border-primary/30"
                    }`}
                  >
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Or enter custom amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-glass w-full text-center"
              />
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!amount || !phone}
              className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40"
            >
              Continue
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Confirm Purchase</h3>
              {[
                { label: "Network", value: networks.find(n => n.id === selectedNetwork)?.name || "" },
                { label: "Phone", value: phone },
                { label: "Amount", value: `KES ${parseFloat(amount).toLocaleString()}` },
                { label: "Fee", value: "Free" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Wallet PIN</label>
              <input type="password" maxLength={6} className="input-glass w-full text-center text-xl tracking-[0.5em]" placeholder="••••" />
            </div>

            <button
              onClick={handlePurchase}
              disabled={processing}
              className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40"
            >
              {processing ? "Processing..." : `Buy KES ${parseFloat(amount).toLocaleString()} Airtime`}
            </button>
          </motion.div>
        )}
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default BuyAirtime;
