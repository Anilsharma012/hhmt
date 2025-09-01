import { AdminSidebar } from '@/components/admin/AdminSidebar';

export function AdminLayout({ header, children }: { header?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {header ? <div className="mb-6">{header}</div> : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
