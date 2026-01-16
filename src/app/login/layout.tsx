import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Login | The Victory Key",
  description: "Login to The Victory Key to track your progress in DSA and CS fundamentals.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}