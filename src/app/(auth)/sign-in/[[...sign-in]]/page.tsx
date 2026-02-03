import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6 safe-top safe-bottom">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-background border border-secondary shadow-xl",
          },
        }}
      />
    </div>
  );
}
