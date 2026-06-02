import { AdminPassportForm } from "@/components/admin-passport-form";

export default function AdminPassportPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Stream Pass Admin</h1>
        <p className="mt-1 text-sm text-muted">Content Passport management</p>
      </div>
      <AdminPassportForm />
    </div>
  );
}
