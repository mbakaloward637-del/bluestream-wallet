import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, User, Mail, Phone, Lock, MapPin, Calendar, Shield, Upload, Camera, Search, ChevronDown, Globe, Banknote, Loader2, CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface KycUpload {
  file: File | null;
  preview: string | null;
  uploading: boolean;
}

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");

  // KYC uploads
  const [idFront, setIdFront] = useState<KycUpload>({ file: null, preview: null, uploading: false });
  const [idBack, setIdBack] = useState<KycUpload>({ file: null, preview: null, uploading: false });
  const [selfie, setSelfie] = useState<KycUpload>({ file: null, preview: null, uploading: false });

  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const countryItems = useMemo(
    () => countries.map((c) => ({ id: c.code, label: c.name, sublabel: `${c.dialCode} · ${c.currencyCode}`, prefix: `${c.flag} ` })),
    []
  );

  const currencyItems = useMemo(() => {
    const unique = getUniqueCurrencies();
    return unique.map((c) => ({ id: c.code, label: `${c.code} — ${c.name}` }));
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const country = countries.find((c) => c.code === selectedCountry);
      if (country) setSelectedCurrency(country.currencyCode);
    }
  }, [selectedCountry]);

  const selectedCountryData: CountryData | undefined = countries.find((c) => c.code === selectedCountry);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<KycUpload>>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Only image files allowed"); return; }
    const preview = URL.createObjectURL(file);
    setter({ file, preview, uploading: false });
  };

  const clearFile = (setter: React.Dispatch<React.SetStateAction<KycUpload>>) => {
    setter({ file: null, preview: null, uploading: false });
  };

  const uploadKycDocuments = async (userId: string) => {
    const uploads: { field: string; file: File; setter: React.Dispatch<React.SetStateAction<KycUpload>> }[] = [];
    if (idFront.file) uploads.push({ field: "id_front_url", file: idFront.file, setter: setIdFront });
    if (idBack.file) uploads.push({ field: "id_back_url", file: idBack.file, setter: setIdBack });
    if (selfie.file) uploads.push({ field: "selfie_url", file: selfie.file, setter: setSelfie });

    const urls: Record<string, string> = {};

    for (const upload of uploads) {
      upload.setter(prev => ({ ...prev, uploading: true }));
      const ext = upload.file.name.split(".").pop();
      const path = `${userId}/${upload.field}.${ext}`;

      const { error } = await supabase.storage
        .from("kyc-documents")
        .upload(path, upload.file, { upsert: true });

      if (error) {
        console.error(`Upload ${upload.field} failed:`, error);
        upload.setter(prev => ({ ...prev, uploading: false }));
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("kyc-documents")
        .getPublicUrl(path);

      urls[upload.field] = urlData.publicUrl;
      upload.setter(prev => ({ ...prev, uploading: false }));
    }

    // Update profile with document URLs
    if (Object.keys(urls).length > 0) {
      await supabase.from("profiles").update(urls).eq("user_id", userId);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (pin.length < 4) { toast.error("PIN must be at least 4 digits"); return; }

    setLoading(true);
    const result = await register(email, password, {
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName,
      phone: selectedCountryData ? `${selectedCountryData.dialCode}${phone}` : phone,
      country: selectedCountryData?.name || "",
      country_code: selectedCountry,
      currency: selectedCurrency,
      city,
      address,
      gender,
      date_of_birth: dob,
    });
    setLoading(false);

    if (result.success) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        // Store wallet PIN (bcrypt hashed server-side)
        if (pin) {
          await supabase.functions.invoke("set-wallet-pin", {
            body: { pin },
          });
        }
        // Upload KYC documents
        if (idFront.file || idBack.file || selfie.file) {
          toast.info("Uploading verification documents...");
          await uploadKycDocuments(session.user.id);
        }
      }
      toast.success("Account created! Please check your email to verify.");
      navigate("/login");
    } else {
      toast.error(result.error || "Registration failed");
    }
  };

  const kycDocs = [
    { label: "Government ID (Front)", icon: Upload, state: idFront, setter: setIdFront, inputRef: idFrontRef },
    { label: "Government ID (Back)", icon: Upload, state: idBack, setter: setIdBack, inputRef: idBackRef },
    { label: "Selfie for Verification", icon: Camera, state: selfie, setter: setSelfie, inputRef: selfieRef },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/")} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Create Account</h1>
        </div>

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
                  <input className="input-field" placeholder="James" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="label-text">Last Name</label>
                  <input className="input-field" placeholder="Mwangi" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label-text">Middle Name (optional)</label>
                <input className="input-field" placeholder="Kiptoo" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><Calendar size={12}/>Date of Birth</label>
                <input type="date" className="input-field" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div>
                <label className="label-text">Gender</label>
                <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <SearchableDropdown label="Country" icon={<Globe size={12} />} placeholder="Select your country" value={selectedCountry} onSelect={setSelectedCountry} items={countryItems} />
              <SearchableDropdown label="Wallet Currency" icon={<Banknote size={12} />} placeholder="Select wallet currency" value={selectedCurrency} onSelect={setSelectedCurrency} items={currencyItems} />

              {selectedCountry && selectedCurrency && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
                  <span className="text-2xl">{selectedCountryData?.flag}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{selectedCountryData?.name}</p>
                    <p className="text-[10px] text-muted-foreground">Default wallet currency: <span className="font-bold text-primary">{selectedCurrency}</span></p>
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
                  <input type="tel" className="input-field flex-1" placeholder="712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><Mail size={12}/>Email Address</label>
                <input type="email" className="input-field" placeholder="james@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><MapPin size={12}/>Physical Address</label>
                <input className="input-field" placeholder="123 Kenyatta Ave" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <label className="label-text">City</label>
                <input className="input-field" placeholder="Nairobi" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div>
                <label className="label-text flex items-center gap-1"><Lock size={12}/>Password</label>
                <input type="password" className="input-field" placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-1">Must be at least 8 characters</p>
              </div>
              <div>
                <label className="label-text">Confirm Password</label>
                <input type="password" className="input-field" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><Shield size={12}/>Transaction PIN (4–6 digits)</label>
                <input type="password" inputMode="numeric" maxLength={6} className="input-field text-center tracking-[0.5em]" placeholder="••••"
                  value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
                <p className="text-[10px] text-muted-foreground mt-1">Numeric only, used for all transactions</p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">Upload documents for identity verification.</p>

              {kycDocs.map((doc) => (
                <div key={doc.label}>
                  <input
                    ref={doc.inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, doc.setter)}
                  />
                  {doc.state.preview ? (
                    <div className="section-card relative">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 size={16} className="text-success" />
                        <p className="text-sm font-medium text-foreground flex-1">{doc.label}</p>
                        <button onClick={() => clearFile(doc.setter)} className="p-1 rounded-lg hover:bg-secondary">
                          <X size={14} className="text-muted-foreground" />
                        </button>
                      </div>
                      <img src={doc.state.preview} alt={doc.label} className="w-full h-32 object-cover rounded-lg" />
                      {doc.state.uploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
                          <Loader2 size={20} className="animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => doc.inputRef.current?.click()}
                      className="section-card w-full flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <doc.icon size={20} className="text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">{doc.label}</p>
                        <p className="text-xs text-muted-foreground">Tap to upload (max 5MB)</p>
                      </div>
                    </button>
                  )}
                </div>
              ))}

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-foreground mb-1">Account Summary</p>
                <p className="text-[10px] text-muted-foreground">Name: <span className="text-foreground">{firstName} {lastName}</span></p>
                <p className="text-[10px] text-muted-foreground">Email: <span className="text-foreground">{email}</span></p>
                <p className="text-[10px] text-muted-foreground">Country: <span className="text-foreground">{selectedCountryData?.flag} {selectedCountryData?.name || "—"}</span></p>
                <p className="text-[10px] text-muted-foreground">Wallet Currency: <span className="text-primary font-bold">{selectedCurrency || "—"}</span></p>
                <p className="text-[10px] text-muted-foreground">Documents: <span className="text-foreground">{[idFront.file, idBack.file, selfie.file].filter(Boolean).length}/3 uploaded</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 pb-8 pt-4">
        <button
          onClick={() => step < 3 ? setStep(step + 1) : handleRegister()}
          disabled={loading}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : (
            <>{step < 3 ? "Continue" : "Create Account"} <ArrowRight size={16} /></>
          )}
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
