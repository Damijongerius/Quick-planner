import { Layout } from "lucide-react";

export function AuthLogo() {
  return (
    <div className="flex items-center gap-xl">
      <div className="relative group">
        <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-[#9333ea] rounded-2xl flex items-center justify-center text-white shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer"></div>
          <Layout size={32} />
        </div>
      </div>
      <div className="text-left">
        <h1 className="text-editorial text-4xl font-bold tracking-tighter text-white" style={{ lineHeight: 0.9 }}>
          Sanctuary
        </h1>
        <p className="text-meta text-[10px] opacity-40 uppercase tracking-[0.3em] mt-1">
          Strategic Engine
        </p>
      </div>
    </div>
  );
}
