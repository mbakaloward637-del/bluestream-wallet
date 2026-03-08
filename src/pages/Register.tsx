import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, User, Mail, Phone, Lock, MapPin, Calendar, Shield, Upload, Camera, Search, ChevronDown, Globe, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { countries, getUniqueCurrencies } from "@/data/countries";
import type { CountryData } from "@/data/countries";

const steps = ["Personal", "Contact", "Security", "Verify"];

interface SearchableDropdownProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onSelect: (val: string) => void;
  items: { id: string; label: string; sublabel?: string; prefix?: string }[];
}

const SearchableDropdown = ({ label, icon, placeholder, value, onSelect, items }: SearchableDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || i.sublabel?.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
    );
  }, [items, search]);

  const selected = items.find((i) => i.id === value);

  return (
    <div ref={ref} className="relative">
      <label className="label-text flex items-center gap-1">{icon}{label}</label>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="input-field flex items-center justify-between w-full text-left"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? `${selected.prefix || ""}${selected.label}` : placeholder}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/50">
              <Search size={14} className="text-muted-foreground" />
              <input
                autoFocus
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground text-center">No results found</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors text-sm ${
                    value === item.id ? "bg-primary/10 text-primary" : "text-foreground"
                  }`}
                >
                  {item.prefix && <span className="text-base">{item.prefix}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">{item.label}</p>
                    {item.sublabel && <p className="text-[10px] text-muted-foreground truncate">{item.sublabel}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");

  const countryItems = useMemo(
    () => countries.map((c) => ({ id: c.code, label: c.name, sublabel: `${c.dialCode} · ${c.currencyCode}`, prefix: `${c.flag} ` })),
    []
  );

  const currencyItems = useMemo(() => {
    const unique = getUniqueCurrencies();
    return unique.map((c) => ({ id: c.code, label: `${c.code} — ${c.name}` }));
  }, []);

  // Auto-set currency when country changes
  useEffect(() => {
    if (selectedCountry) {
      const country = countries.find((c) => c.code === selectedCountry);
      if (country) setSelectedCurrency(country.currencyCode);
    }
  }, [selectedCountry]);

  const selectedCountryData: CountryData | undefined = countries.find((c) => c.code === selectedCountry);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/")} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Create Account</h1>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-border"}`} />
              <p className={`mt-1.5 text-[10px] font-medium ${i <= step ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto pb-4">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text flex items-center gap-1"><User size={12}/>First Name</label>
                  <input className="input-field" placeholder="James" />
                </div>
                <div>
                  <label className="label-text">Last Name</label>
                  <input className="input-field" placeholder="Mwangi" />
                </div>
              </div>
              <div>
                <label className="label-text">Middle Name (optional)</label>
                <input className="input-field" placeholder="Kiptoo" />
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><Calendar size={12}/>Date of Birth</label>
                <input type="date" className="input-field" />
              </div>
              <div>
                <label className="label-text">Gender</label>
                <select className="input-field">
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <SearchableDropdown
                label="Country"
                icon={<Globe size={12} />}
                placeholder="Select your country"
                value={selectedCountry}
                onSelect={setSelectedCountry}
                items={countryItems}
              />

              <SearchableDropdown
                label="Wallet Currency"
                icon={<Banknote size={12} />}
                placeholder="Select wallet currency"
                value={selectedCurrency}
                onSelect={setSelectedCurrency}
                items={currencyItems}
              />

              {selectedCountry && selectedCurrency && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3"
                >
                  <span className="text-2xl">{selectedCountryData?.flag}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{selectedCountryData?.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Default wallet currency: <span className="font-bold text-primary">{selectedCurrency}</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div>
                <label className="label-text flex items-center gap-1"><Phone size={12}/>Phone Number</label>
                <div className="flex gap-2">
                  <div className="input-field w-24 flex items-center justify-center text-sm shrink-0">
                    {selectedCountryData ? `${selectedCountryData.flag} ${selectedCountryData.dialCode}` : "+---"}
                  </div>
                  <input type="tel" className="input-field flex-1" placeholder="712 345 678" />
                </div>
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><Mail size={12}/>Email Address</label>
                <input type="email" className="input-field" placeholder="james@email.com" />
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><MapPin size={12}/>Physical Address</label>
                <input className="input-field" placeholder="123 Kenyatta Ave" />
              </div>
              <div>
                <label className="label-text">City</label>
                <input className="input-field" placeholder="Nairobi" />
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Country: <span className="font-semibold text-foreground">{selectedCountryData?.flag} {selectedCountryData?.name || "Not selected"}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Wallet Currency: <span className="font-semibold text-primary">{selectedCurrency || "Not selected"}</span>
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div>
                <label className="label-text flex items-center gap-1"><Lock size={12}/>Password</label>
                <input type="password" className="input-field" placeholder="Minimum 8 characters" />
                <p className="text-[10px] text-muted-foreground mt-1">Must be at least 8 characters</p>
              </div>
              <div>
                <label className="label-text">Confirm Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><Shield size={12}/>Transaction PIN (4–6 digits)</label>
                <input type="password" inputMode="numeric" maxLength={6} className="input-field text-center tracking-[0.5em]" placeholder="••••" />
                <p className="text-[10px] text-muted-foreground mt-1">Numeric only, used for all transactions</p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">Upload documents for identity verification.</p>

              {[
                { label: "Government ID (Front)", icon: Upload },
                { label: "Government ID (Back)", icon: Upload },
                { label: "Selfie for Verification", icon: Camera },
              ].map((doc) => (
                <div key={doc.label} className="section-card flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <doc.icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{doc.label}</p>
                    <p className="text-xs text-muted-foreground">Tap to upload</p>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-foreground mb-1">Account Summary</p>
                <p className="text-[10px] text-muted-foreground">Country: <span className="text-foreground">{selectedCountryData?.flag} {selectedCountryData?.name || "—"}</span></p>
                <p className="text-[10px] text-muted-foreground">Wallet Currency: <span className="text-primary font-bold">{selectedCurrency || "—"}</span></p>
              </div>

              <p className="text-[10px] text-muted-foreground">Proof of address is optional but recommended for faster verification.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 pb-8 pt-4">
        <button
          onClick={() => step < 3 ? setStep(step + 1) : navigate("/dashboard")}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {step < 3 ? "Continue" : "Create Account"}
          <ArrowRight size={16} />
        </button>

        {step === 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-primary font-semibold">Sign In</button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
