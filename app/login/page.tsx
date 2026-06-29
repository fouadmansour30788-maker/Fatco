import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in · FATCO CRM" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">
            F
          </div>
          <h1 className="text-lg font-semibold tracking-tight">FATCO CRM</h1>
          <p className="text-sm text-zinc-500">Sign in to continue</p>
        </div>

        <div className="card p-6">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Demo: admin@fatco.com / fatco123
        </p>
      </div>
    </div>
  );
}
