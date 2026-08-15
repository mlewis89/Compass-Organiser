"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header, Message, Segment } from "semantic-ui-react";
import { usePermissions } from "@/lib/client/usePermissions";
import AdminGroupsPanel from "@/components/AdminGroupsPanel";

export default function AdminGroupsPage() {
  const router = useRouter();
  const { permissions, loading } = usePermissions();

  useEffect(() => {
    if (!loading && !permissions.isPlatformAdmin) {
      const timer = window.setTimeout(() => {
        router.replace("/dashboard");
      }, 4000);
      return () => window.clearTimeout(timer);
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
    return (
      <Segment padded>
        <Message warning>
          <Message.Header>Platform admin access required</Message.Header>
          <p>
            Add your signed-in email to the <code>GROUP_ADMIN_EMAILS</code>{" "}
            environment variable (comma-separated), then restart the app /
            redeploy. Without that, this page is hidden and redirects to the
            dashboard.
          </p>
        </Message>
      </Segment>
    );
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
