"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header, Segment } from "semantic-ui-react";
import { usePermissions } from "@/lib/client/usePermissions";
import AdminGroupsPanel from "@/components/AdminGroupsPanel";

export default function AdminGroupsPage() {
  const router = useRouter();
  const { permissions, loading } = usePermissions();

  useEffect(() => {
    if (!loading && !permissions.isPlatformAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, permissions.isPlatformAdmin, router]);

  if (loading) {
    return (
      <Segment padded>
        <p>Loading…</p>
      </Segment>
    );
  }

  if (!permissions.isPlatformAdmin) {
    return null;
  }

  return (
    <>
      <Segment padded>
        <Header as="h2">Platform groups</Header>
        <p>
          Create and manage scout groups, assign users, and reclaim orphaned
          accounts (no active membership).
        </p>
      </Segment>
      <AdminGroupsPanel />
    </>
  );
}
