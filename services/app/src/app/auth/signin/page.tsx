import { SignInForm } from "./SignInContent";
import { isDevLoginEnabled, DEV_LOGIN_EMAIL_DEFAULT } from "@/lib/devLogin";
import { enabledProviders } from "@/lib/mail/config";

// Read at request time so the flags are never baked into the build.
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const dev = isDevLoginEnabled();
  return <SignInForm providers={enabledProviders(process.env, dev)} devEmail={process.env.AUTH_DEV_LOGIN_EMAIL || DEV_LOGIN_EMAIL_DEFAULT} />;
}
