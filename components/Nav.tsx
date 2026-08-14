"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton } from "@clerk/nextjs";
import {
  Grid,
  GridColumn,
  GridRow,
  Image,
  Menu,
  MenuItem,
  Segment,
} from "semantic-ui-react";

export default function Nav() {
  const pathname = usePathname();

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
            <Menu stackable>
              <Show when="signed-in">
                <>
                  <MenuItem
                    as={Link}
                    href="/dashboard"
                    name="Dashboard"
                    active={pathname === "/dashboard"}
                  />
                  <MenuItem
                    as={Link}
                    href="/tasks"
                    name="Tasks"
                    active={pathname === "/tasks"}
                  />
                  <MenuItem
                    as={Link}
                    href="/events"
                    name="Events"
                    active={pathname === "/events"}
                  />
                  <MenuItem
                    as={Link}
                    href="/members"
                    name="members"
                    active={pathname === "/members"}
                  />
                  <MenuItem>
                    <UserButton />
                  </MenuItem>
                </>
              </Show>
              <Show when="signed-out">
                <>
                  <MenuItem
                    as={Link}
                    href="/"
                    name="Home"
                    active={pathname === "/"}
                  />
                  <MenuItem
                    as={Link}
                    href="/about"
                    name="About"
                    active={pathname === "/about"}
                  />
                  <MenuItem
                    as={Link}
                    href="/contact"
                    name="Contact"
                    active={pathname === "/contact"}
                  />
                  <MenuItem
                    as={Link}
                    href="/sign-in"
                    name="Log in"
                    active={pathname.startsWith("/sign-in")}
                  />
                  <MenuItem
                    as={Link}
                    href="/sign-up"
                    name="Sign up"
                    active={pathname.startsWith("/sign-up")}
                  />
                </>
              </Show>
            </Menu>
          </GridColumn>
        </GridRow>
      </Grid>
    </Segment>
  );
}
