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

  const enabledModules = expandEnabledModules(
    data?.activeGroup?.enabledModules ?? defaultModules,
  );

  return {
    enabledModules,
    activeGroup: data?.activeGroup ?? null,
    loading: !isLoaded || loading,
    refetch,
  };
}
