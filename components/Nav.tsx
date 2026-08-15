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
import { useGroupModules } from "@/lib/client/useGroupModules";
import type { GroupSummary } from "@/lib/client/types";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { permissions } = usePermissions();
  const { enabledModules } = useGroupModules();
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

  const isOnPlatformSettings =
    pathname.startsWith("/admin/groups") ||
    pathname.startsWith("/admin/skills");

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
          ...(enabledModules.tasks
            ? [
                <MenuItem
                  key="tasks"
                  as="a"
                  href="/tasks"
                  name="Tasks"
                  active={pathname === "/tasks"}
                />,
              ]
            : []),
          ...(enabledModules.events
            ? [
                <MenuItem
                  key="events"
                  as="a"
                  href="/events"
                  name="Events"
                  active={pathname === "/events"}
                />,
              ]
            : []),
          <MenuItem
            key="settings"
            as="a"
            href="/settings"
            name="Settings"
            active={pathname.startsWith("/settings")}
          />,
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
    <Segment className="app-nav">
      <Grid columns={3}>
        <GridRow>
          <GridColumn width={5} verticalAlign="middle">
            <Image
              className="header-logo"
              src="/header.png"
              size="medium"
              alt="Compass Organiser"
            />
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
                      </Dropdown.Menu>
                    </Dropdown>
                  ) : null}
                  <UserButton />
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  width: "100%",
                }}
              >
                <Menu className="app-nav-menu" style={{ flex: 1, marginBottom: 0 }}>
                  {items}
                </Menu>
                {isLoaded && isSignedIn && permissions.isPlatformAdmin ? (
                  <Dropdown
                    text="Platform"
                    button
                    className="icon"
                    pointing="top right"
                    style={{
                      marginBottom: 0,
                      ...(isOnPlatformSettings
                        ? { backgroundColor: "#f3f4f6" }
                        : {}),
                    }}
                  >
                    <Dropdown.Menu>
                      <Dropdown.Item
                        as="a"
                        href="/admin/groups"
                        active={pathname.startsWith("/admin/groups")}
                      >
                        Groups
                      </Dropdown.Item>
                      <Dropdown.Item
                        as="a"
                        href="/admin/skills"
                        active={pathname.startsWith("/admin/skills")}
                      >
                        Platform skills
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                ) : null}
              </div>
            </div>
          </GridColumn>
        </GridRow>
      </Grid>
    </Segment>
  );
}
