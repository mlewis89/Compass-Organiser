"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header, Message, Segment } from "semantic-ui-react";
import { usePermissions } from "@/lib/client/usePermissions";
import PlatformSkillsPanel from "@/components/PlatformSkillsPanel";

export default function AdminSkillsPage() {
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
            Add your signed-in email to <code>GROUP_ADMIN_EMAILS</code> to manage
            the platform skills catalog.
          </p>
        </Message>
      </Segment>
    );
  }

  return (
    <>
      <Segment padded>
        <Header as="h2">Platform skills</Header>
        <p>
          Curate shared default skills and approve promotions requested by groups.
        </p>
      </Segment>
      <PlatformSkillsPanel />
    </>
  );
}
