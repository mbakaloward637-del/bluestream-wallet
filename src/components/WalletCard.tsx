import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface WalletCardProps {
  balance: number;
  currency: string;
  walletNumber: string;
  userName: string;
}

const WalletCard = ({ balance, currency, walletNumber, userName }: WalletCardProps) => {
  const [showBalance, setShowBalance] = useState(true);

  const formatBalance = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const currencySymbols: Record<string, string> = {
    USD: "$", KES: "KSh", NGN: "₦", GBP: "£", EUR: "€",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground">
      {/* Subtle decoration */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/5" />
      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-primary-foreground/5" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-primary-foreground/70">Total Balance</p>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        <h2 className="mt-2 text-3xl font-bold">
          {showBalance
            ? `${currencySymbols[currency] || currency} ${formatBalance(balance)}`
            : "••••••"}
        </h2>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-xs text-primary-foreground/50">Wallet Number</p>
            <p className="mt-0.5 text-sm font-semibold text-primary-foreground/90 tracking-wider">
              {walletNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-foreground/50">{userName}</p>
            <p className="mt-0.5 text-sm font-bold text-primary-foreground/90">{currency}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
