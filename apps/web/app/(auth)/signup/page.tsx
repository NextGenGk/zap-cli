import { AuthForm } from "@/components/marketing/auth-form";
import { signUpWithPassword, signInWithGithub } from "@/app/(auth)/actions";

export default function SignupPage() {
  return <AuthForm mode="signup" action={signUpWithPassword} onGithub={signInWithGithub} />;
}
