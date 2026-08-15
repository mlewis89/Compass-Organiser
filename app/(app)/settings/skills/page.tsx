"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Message, Segment } from "semantic-ui-react";
import { usePermissions } from "@/lib/client/usePermissions";
import { useGroupModules } from "@/lib/client/useGroupModules";
import GroupSkillsPanel from "@/components/GroupSkillsPanel";

export default function GroupSkillsSettingsPage() {
  const router = useRouter();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { enabledModules, loading: modulesLoading } = useGroupModules();

  const loading = permissionsLoading || modulesLoading;
  const canAccess =
    enabledModules.skills &&
    (permissions.canManageMembers || permissions.isPlatformAdmin);

  useEffect(() => {
    if (!loading && !canAccess) {
      const timer = window.setTimeout(() => {
        router.replace("/dashboard");
      }, 4000);
      return () => window.clearTimeout(timer);
    }
  }, [loading, canAccess, router]);

  if (loading) {
    return (
      <Segment padded>
        <p>Loading…</p>
      </Segment>
    );
  }

  if (!enabledModules.skills) {
    return (
      <Segment padded>
        <Message warning>
          <Message.Header>Skills are disabled</Message.Header>
          <p>
            Skills are available when the Tasks module is enabled. Ask a group
            leader to turn Tasks on under Modules.
          </p>
        </Message>
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

  return <GroupSkillsPanel />;
}
