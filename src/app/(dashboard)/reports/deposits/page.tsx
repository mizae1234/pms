import { Header } from "@/components/layout/header";
import { FileBarChart } from "lucide-react";

export default function DepositReportPage() {
  return (
    <div className="animate-fade-in">
      <Header title="Deposit Report" subtitle="รายงานเงินมัดจำ" />
      <div className="flex flex-col items-center justify-center p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
          <FileBarChart className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-text-primary">Deposit Report</h2>
        <p className="mt-1 text-sm text-text-muted">อยู่ระหว่างพัฒนา — Phase 2</p>
      </div>
    </div>
  );
}
