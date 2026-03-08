import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const reports = [
  { id: "daily_transactions", label: "Daily Transaction Report", desc: "All transactions for the current day", icon: FileText },
  { id: "user_registrations", label: "User Registration Report", desc: "New user registrations and KYC status", icon: FileText },
  { id: "deposits", label: "Deposit Report", desc: "All deposits by method (Card, M-Pesa, Bank)", icon: FileText },
  { id: "withdrawals", label: "Withdrawal Report", desc: "All withdrawal requests and their status", icon: FileText },
  { id: "airtime_sales", label: "Airtime Sales Report", desc: "Airtime purchases by network provider", icon: FileText },
];

const AdminReports = () => {
  const handleExport = (reportId: string, format: "pdf" | "excel") => {
    toast.success(`Generating ${format.toUpperCase()} report...`);
    setTimeout(() => toast.success(`${format.toUpperCase()} report downloaded`), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="section-card">
        <p className="text-sm text-muted-foreground">Generate and export operational reports for analysis and record-keeping.</p>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="section-card">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <report.icon size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{report.label}</p>
                <p className="text-xs text-muted-foreground">{report.desc}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport(report.id, "pdf")}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Download size={14} className="text-destructive" />
                Export PDF
              </button>
              <button
                onClick={() => handleExport(report.id, "excel")}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <FileSpreadsheet size={14} className="text-success" />
                Export Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReports;
