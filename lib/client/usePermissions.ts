import { useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { QUERY_MY_PERMISSIONS } from "@/lib/client/queries";
import type { Permissions } from "@/lib/client/types";

const emptyPermissions: Permissions = {
  roles: [],
  canManageTasks: false,
  canManageEvents: false,
  canManagePosts: false,
  canManageMembers: false,
  canManageGroupModules: false,
  canViewAllUnitBuckets: false,
  isPlatformAdmin: false,
};

export function usePermissions() {
  const { isSignedIn, isLoaded } = useAuth();
  const { data, loading } = useQuery<{ myPermissions: Permissions }>(
    QUERY_MY_PERMISSIONS,
    { skip: !isLoaded || !isSignedIn },
  );
  return { permissions: data?.myPermissions ?? emptyPermissions, loading };
}
