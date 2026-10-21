import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface AuthErrorBannerProps {
  error: string;
}

export function AuthErrorBanner({ error }: Readonly<AuthErrorBannerProps>) {
  const getErrorMessage = (err: string) => {
    switch (err) {
      case "OAuthAccountNotLinked":
        return "This email is already registered with a different sign-in method. Use the one you signed up with, or the email link.";
      case "AccessDenied":
        return "Access denied. Please try again with a different account.";
      case "Verification":
        return "That sign-in link has expired or was already used. Request a new one.";
      case "Configuration":
        return "Sign-in is temporarily unavailable. Please try again later.";
      default:
        return "An error occurred during sign in.";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-left text-sm text-danger"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <p>{getErrorMessage(error)}</p>
    </motion.div>
  );
}
