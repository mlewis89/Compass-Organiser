import { useQuery } from "@apollo/client";
import { QUERY_MY_PERMISSIONS } from "@/lib/client/queries";
import type { Permissions } from "@/lib/client/types";

const emptyPermissions: Permissions = {
  roles: [],
  canManageTasks: false,
  canManageEvents: false,
  canManagePosts: false,
  canManageMembers: false,
};

export function usePermissions() {
  const { data, loading } = useQuery<{ myPermissions: Permissions }>(
    QUERY_MY_PERMISSIONS,
  );
  return { permissions: data?.myPermissions ?? emptyPermissions, loading };
}
