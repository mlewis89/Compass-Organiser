import AuthGuard from "@/components/AuthGuard";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
