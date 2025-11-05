import LoginForm from "@/components/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rundex - Login",
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <LoginForm />
    </div>
  );
}
