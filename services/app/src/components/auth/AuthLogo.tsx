import { Layout } from "lucide-react";

export function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-md">
      <div className="relative group">
        <div className="absolute inset-0 bg-primary blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
        <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-[#9333ea] rounded-[28px] flex items-center justify-center text-white shadow-2xl overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer"></div>
          <Layout size={40} strokeWidth={1.5} />
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-editorial text-5xl font-bold tracking-tight text-on-surface" style={{ letterSpacing: '-0.04em' }}>
          Planner
        </h1>
        <p className="text-meta text-[10px] opacity-40 uppercase tracking-[0.4em] mt-2 font-black">
          Strategic Engine
        </p>
      </div>
    </div>
  );
}
