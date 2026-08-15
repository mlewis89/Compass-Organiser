import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { QUERY_MY_GROUPS } from "@/lib/client/queries";
import type { EnabledModules, GroupSummary } from "@/lib/client/types";
import { expandEnabledModules } from "@/lib/groupModules";

const defaultModules: EnabledModules = expandEnabledModules({});

export function useGroupModules() {
  const { isSignedIn, isLoaded } = useAuth();
  const { data, loading, refetch } = useQuery<{
    myGroups: GroupSummary[];
    activeGroup: GroupSummary | null;
  }>(QUERY_MY_GROUPS, { skip: !isLoaded || !isSignedIn });

  const rawModules = data?.activeGroup?.enabledModules;
  const enabledModules = useMemo(
    () => expandEnabledModules(rawModules ?? defaultModules),
    [
      rawModules?.tasks,
      rawModules?.events,
      rawModules?.noticeBoard,
      rawModules?.memberStats,
      rawModules?.skills,
    ],
  );

  return {
    enabledModules,
    activeGroup: data?.activeGroup ?? null,
    loading: !isLoaded || loading,
    refetch,
  };
}
