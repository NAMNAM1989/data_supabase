import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#E4EBF3] p-4">
      <LoginForm redirectTo={params.redirect} />
    </div>
  );
}
