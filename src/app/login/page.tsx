import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="dark min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
