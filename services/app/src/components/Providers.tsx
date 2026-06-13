import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
