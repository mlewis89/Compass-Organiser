"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header, Message, Segment } from "semantic-ui-react";
import { usePermissions } from "@/lib/client/usePermissions";
import GroupSkillsPanel from "@/components/GroupSkillsPanel";

export default function GroupSkillsPage() {
  const router = useRouter();
  const { permissions, loading } = usePermissions();

  useEffect(() => {
    if (!loading && !permissions.canManageMembers && !permissions.isPlatformAdmin) {
      const timer = window.setTimeout(() => {
        router.replace("/dashboard");
      }, 4000);
      return () => window.clearTimeout(timer);
    }
  }, [loading, permissions.canManageMembers, permissions.isPlatformAdmin, router]);

  if (loading) {
    return (
      <Segment padded>
        <p>Loading…</p>
      </Segment>
    );
  }

  if (!permissions.canManageMembers && !permissions.isPlatformAdmin) {
    return (
      <Segment padded>
        <Message warning>
          <Message.Header>Group admin access required</Message.Header>
          <p>Only group admins can manage the group skills catalog.</p>
        </Message>
      </Segment>
    );
  }

  return (
    <>
      <Segment padded>
        <Header as="h2">Group skills</Header>
        <p>Manage skills specific to this group and request platform promotions.</p>
      </Segment>
      <GroupSkillsPanel />
    </>
  );
}
