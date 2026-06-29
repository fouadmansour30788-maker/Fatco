import PortalLoginForm from "./PortalLoginForm";

export const metadata = { title: "Sign in · FATCO Customer Portal" };

export default function PortalLoginPage() {
  return (
    <div className="mx-auto max-w-sm py-10">
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-zinc-500">
          Sign in to see your service history &amp; rewards
        </p>
      </div>
      <div className="card p-6">
        <PortalLoginForm />
      </div>
      <p className="mt-4 text-center text-xs text-zinc-400">
        Ask FATCO staff for your portal PIN.
      </p>
    </div>
  );
}
