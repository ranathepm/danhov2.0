import { requireAdmin } from '@/lib/admin-auth';
import AccountingDashboard from '@/components/admin/AccountingDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminAccountingPage() {
  await requireAdmin();
  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <h1 className="adm-h1">Accounting</h1>
          <p className="adm-page-sub">
            Sales, deposits, balances — filter by any date range, day, or month.
          </p>
        </div>
      </header>
      <AccountingDashboard />
    </div>
  );
}
