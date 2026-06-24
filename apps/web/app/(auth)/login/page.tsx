import { AuthForm } from "@/components/marketing/auth-form";
import { signInWithPassword, signInWithGithub, signInWithGoogle } from "@/app/(auth)/actions";

export default function LoginPage() {
  return <AuthForm mode="login" action={signInWithPassword} onGithub={signInWithGithub} onGoogle={signInWithGoogle} />;
}
