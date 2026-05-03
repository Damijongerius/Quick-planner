import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface AuthErrorBannerProps {
  error: string;
}

export function AuthErrorBanner({ error }: AuthErrorBannerProps) {
  const getErrorMessage = (err: string) => {
    switch (err) {
      case "MIGRATED_TO_GOOGLE":
        return "You have already migrated to Google. Please sign in with Google above.";
      case "USER_NOT_FOUND":
        return "No legacy account found with this email. Please sign in with Google.";
      case "CredentialsSignin":
        return "Invalid credentials. If you are new, please use Google.";
      default:
        return "An error occurred during sign in.";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: '32px',
        padding: '16px',
        backgroundColor: 'rgba(168, 54, 75, 0.05)',
        border: '1px solid var(--error)',
        borderRadius: '16px',
        color: 'var(--error)',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textAlign: 'left'
      }}
    >
      <AlertCircle size={18} style={{ flexShrink: 0 }} />
      <p>{getErrorMessage(error)}</p>
    </motion.div>
  );
}
