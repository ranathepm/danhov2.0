import { requireAdmin } from '@/lib/admin-auth';
import PasswordForm from '@/components/admin/PasswordForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <h1 className="adm-h1">Settings</h1>
        <p className="adm-page-sub">{admin.email}</p>
      </header>

      <section className="adm-card adm-card--narrow">
        <header className="adm-card-head"><h2 className="adm-h2">Change password</h2></header>
        <PasswordForm />
      </section>

      <section className="adm-card adm-card--narrow">
        <header className="adm-card-head"><h2 className="adm-h2">Sign-in details</h2></header>
        <div className="adm-fields">
          <div className="adm-field">
            <span className="adm-field-label">Email</span>
            <input className="adm-input" value={admin.email} readOnly />
          </div>
          <div className="adm-field">
            <span className="adm-field-label">Role</span>
            <input className="adm-input" value="Administrator" readOnly />
          </div>
        </div>
      </section>
    </div>
  );
}
