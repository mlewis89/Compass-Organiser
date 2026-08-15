"use client";

import { usePathname } from "next/navigation";
import { Header, Menu, MenuItem, Segment } from "semantic-ui-react";
import { usePermissions } from "@/lib/client/usePermissions";
import { useGroupModules } from "@/lib/client/useGroupModules";

export default function GroupSettingsNav() {
  const pathname = usePathname();
  const { permissions } = usePermissions();
  const { enabledModules } = useGroupModules();

  const showUnits =
    enabledModules.tasks &&
    (permissions.canManageTasks || permissions.isPlatformAdmin);
  const showSkills =
    enabledModules.skills &&
    (permissions.canManageMembers || permissions.isPlatformAdmin);
  const showModules =
    permissions.canManageGroupModules || permissions.isPlatformAdmin;

  return (
    <Segment padded style={{ marginBottom: 0 }}>
      <Header as="h2">Group settings</Header>
      <Menu pointing secondary>
        <MenuItem
          as="a"
          href="/settings/members"
          name="Members"
          active={pathname.startsWith("/settings/members")}
        />
        {showUnits ? (
          <MenuItem
            as="a"
            href="/settings/units"
            name="Units"
            active={pathname.startsWith("/settings/units")}
          />
        ) : null}
        {showSkills ? (
          <MenuItem
            as="a"
            href="/settings/skills"
            name="Skills"
            active={pathname.startsWith("/settings/skills")}
          />
        ) : null}
        {showModules ? (
          <MenuItem
            as="a"
            href="/settings/modules"
            name="Modules"
            active={pathname.startsWith("/settings/modules")}
          />
        ) : null}
      </Menu>
    </Segment>
  );
}
