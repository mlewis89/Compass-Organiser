import AuthGuard from "@/components/AuthGuard";
import RequireActiveGroup from "@/components/RequireActiveGroup";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RequireActiveGroup>{children}</RequireActiveGroup>
    </AuthGuard>
  );
}
