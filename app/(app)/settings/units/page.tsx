"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Message, Segment } from "semantic-ui-react";
import { usePermissions } from "@/lib/client/usePermissions";
import { useGroupModules } from "@/lib/client/useGroupModules";
import UnitsPanel from "@/components/UnitsPanel";

export default function GroupUnitsSettingsPage() {
  const router = useRouter();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { enabledModules, loading: modulesLoading } = useGroupModules();

  const loading = permissionsLoading || modulesLoading;
  const canAccess =
    enabledModules.tasks &&
    (permissions.canManageTasks || permissions.isPlatformAdmin);

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

  if (!enabledModules.tasks) {
    return (
      <Segment padded>
        <Message warning>
          <Message.Header>Tasks are disabled</Message.Header>
          <p>
            Units are used to assign teams to tasks. Ask a group leader to turn
            Tasks on under Modules.
          </p>
        </Message>
      </Segment>
    );
  }

  if (!permissions.canManageTasks && !permissions.isPlatformAdmin) {
    return (
      <Segment padded>
        <Message warning>
          <Message.Header>Leader access required</Message.Header>
          <p>Only leaders can create units and allocate members to them.</p>
        </Message>
      </Segment>
    );
  }

  return <UnitsPanel />;
}
