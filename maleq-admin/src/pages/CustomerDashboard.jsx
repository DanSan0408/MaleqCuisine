import DashboardSections from '../components/DashboardSections';
import Header from '../components/Header';

export default function CustomerDashboard() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_34%,_#ffffff_72%)] text-slate-900">
      <div className="flex min-h-screen w-full flex-col">
        <Header pageTitle="Customer Home" />
        <main className="w-full flex-1">
          <div className="animate-fade-in-up stagger-1">
            <DashboardSections />
          </div>
        </main>
      </div>
    </div>
  );
}