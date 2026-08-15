"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "@apollo/client";
import {
  Dropdown,
  Grid,
  GridColumn,
  GridRow,
  Image,
  Menu,
  MenuItem,
  Segment,
} from "semantic-ui-react";
import { QUERY_MY_GROUPS } from "@/lib/client/queries";
import { usePermissions } from "@/lib/client/usePermissions";
import type { GroupSummary } from "@/lib/client/types";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { permissions } = usePermissions();
  const { data: groupsData, refetch: refetchGroups } = useQuery<{
    myGroups: GroupSummary[];
    activeGroup: GroupSummary | null;
  }>(QUERY_MY_GROUPS, { skip: !isLoaded || !isSignedIn });

  const myGroups = groupsData?.myGroups ?? [];
  const activeSlug = groupsData?.activeGroup?.slug ?? myGroups[0]?.slug ?? null;

  const switchGroup = async (slug: string) => {
    const response = await fetch("/api/active-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (!response.ok) {
      return;
    }
    await refetchGroups();
    router.refresh();
    window.location.reload();
  };

  const items =
    isLoaded && isSignedIn
      ? [
          <MenuItem
            key="dashboard"
            as="a"
            href="/dashboard"
            name="Dashboard"
            active={pathname === "/dashboard"}
          />,
          <MenuItem
            key="tasks"
            as="a"
            href="/tasks"
            name="Tasks"
            active={pathname === "/tasks"}
          />,
          <MenuItem
            key="events"
            as="a"
            href="/events"
            name="Events"
            active={pathname === "/events"}
          />,
          <MenuItem
            key="members"
            as="a"
            href="/members"
            name="members"
            active={pathname === "/members"}
          />,
          ...(permissions.canManageMembers || permissions.isPlatformAdmin
            ? [
                <MenuItem
                  key="skills"
                  as="a"
                  href="/skills"
                  name="Skills"
                  active={pathname === "/skills"}
                />,
              ]
            : []),
          ...(permissions.isPlatformAdmin
            ? [
                <MenuItem
                  key="admin-groups"
                  as="a"
                  href="/admin/groups"
                  name="Groups"
                  active={pathname.startsWith("/admin/groups")}
                />,
                <MenuItem
                  key="admin-skills"
                  as="a"
                  href="/admin/skills"
                  name="Platform skills"
                  active={pathname.startsWith("/admin/skills")}
                />,
              ]
            : []),
        ]
      : [
          <MenuItem
            key="home"
            as="a"
            href="/"
            name="Home"
            active={pathname === "/"}
          />,
          <MenuItem
            key="about"
            as="a"
            href="/about"
            name="About"
            active={pathname === "/about"}
          />,
          <MenuItem
            key="contact"
            as="a"
            href="/contact"
            name="Contact"
            active={pathname === "/contact"}
          />,
          <MenuItem
            key="sign-in"
            as="a"
            href="/sign-in"
            name="Log in"
            active={pathname.startsWith("/sign-in")}
          />,
          <MenuItem
            key="sign-up"
            as="a"
            href="/sign-up"
            name="Sign up"
            active={pathname.startsWith("/sign-up")}
          />,
        ];

  return (
    <Segment>
      <Grid columns={3} stackable>
        <GridRow>
          <GridColumn width={5} verticalAlign="middle">
            <Image src="/header.png" size="medium" alt="Compass Organiser" />
          </GridColumn>
          <GridColumn width={4} only="tablet computer">
            <Image src="/path.png" alt="" />
          </GridColumn>
          <GridColumn width={7} verticalAlign="bottom">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "0.5rem",
              }}
            >
              {isLoaded && isSignedIn ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  {myGroups.length > 0 ? (
                    <Dropdown
                      text={
                        myGroups.find((group) => group.slug === activeSlug)
                          ?.name ?? "Group"
                      }
                      compact
                      button
                      className="icon"
                    >
                      <Dropdown.Menu>
                        {myGroups.map((group) => (
                          <Dropdown.Item
                            key={group._id}
                            active={group.slug === activeSlug}
                            onClick={() => {
                              if (group.slug !== activeSlug) {
                                void switchGroup(group.slug);
                              }
                            }}
                          >
                            {group.name}
                          </Dropdown.Item>
                        ))}
                        {permissions.isPlatformAdmin ? (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item
                              as="a"
                              href="/admin/groups"
                              active={pathname.startsWith("/admin/groups")}
                            >
                              Edit groups
                            </Dropdown.Item>
                            <Dropdown.Item
                              as="a"
                              href="/admin/skills"
                              active={pathname.startsWith("/admin/skills")}
                            >
                              Platform skills
                            </Dropdown.Item>
                          </>
                        ) : null}
                      </Dropdown.Menu>
                    </Dropdown>
                  ) : null}
                  <UserButton />
                </div>
              ) : null}
              <Menu stackable style={{ width: "100%", marginBottom: 0 }}>
                {items}
              </Menu>
            </div>
          </GridColumn>
        </GridRow>
      </Grid>
    </Segment>
  );
}
