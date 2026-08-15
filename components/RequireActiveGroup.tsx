"use client";

import { useQuery } from "@apollo/client";
import { Message, Segment } from "semantic-ui-react";
import { QUERY_MY_GROUPS } from "@/lib/client/queries";
import { usePermissions } from "@/lib/client/usePermissions";
import type { GroupSummary } from "@/lib/client/types";

type Props = {
  children: React.ReactNode;
};

export default function RequireActiveGroup({ children }: Props) {
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { data, loading } = useQuery<{
    myGroups: GroupSummary[];
    activeGroup: GroupSummary | null;
  }>(QUERY_MY_GROUPS);

  if (loading || permissionsLoading) {
    return (
      <Segment padded>
        <p>Loading…</p>
      </Segment>
    );
  }

  if (permissions.isPlatformAdmin) {
    return <>{children}</>;
  }

  if (!data?.activeGroup && (data?.myGroups?.length ?? 0) === 0) {
    return (
      <Segment padded>
        <Message info>
          <Message.Header>You&apos;re not in a group yet</Message.Header>
          <p>
            Ask a platform admin to assign you to a scout group, or wait for an
            invitation email.
          </p>
        </Message>
      </Segment>
    );
  }

  return <>{children}</>;
}
