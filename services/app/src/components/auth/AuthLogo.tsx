import { Layout } from "lucide-react";

export function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-md">
        <Layout size={24} strokeWidth={1.75} />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to Planner</h1>
        <p className="mt-1 text-sm text-muted">Plan projects, sprints and work in one place.</p>
      </div>
    </div>
  );
}
