import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Us | The Victory Key",
  description: "Get in touch with the The Victory Key team. We'd love to hear from you!",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}