import GroupSettingsNav from "@/components/GroupSettingsNav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GroupSettingsNav />
      {children}
    </>
  );
}
