"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
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
  const { isLoaded, isSignedIn } = useAuth();

  const items =
    isLoaded && isSignedIn
      ? [
          <MenuItem
            key="dashboard"
            as={Link}
            href="/dashboard"
            name="Dashboard"
            active={pathname === "/dashboard"}
          />,
          <MenuItem
            key="tasks"
            as={Link}
            href="/tasks"
            name="Tasks"
            active={pathname === "/tasks"}
          />,
          <MenuItem
            key="events"
            as={Link}
            href="/events"
            name="Events"
            active={pathname === "/events"}
          />,
          <MenuItem
            key="members"
            as={Link}
            href="/members"
            name="members"
            active={pathname === "/members"}
          />,
          <MenuItem key="account">
            <UserButton />
          </MenuItem>,
        ]
      : [
          <MenuItem
            key="home"
            as={Link}
            href="/"
            name="Home"
            active={pathname === "/"}
          />,
          <MenuItem
            key="about"
            as={Link}
            href="/about"
            name="About"
            active={pathname === "/about"}
          />,
          <MenuItem
            key="contact"
            as={Link}
            href="/contact"
            name="Contact"
            active={pathname === "/contact"}
          />,
          <MenuItem
            key="sign-in"
            as={Link}
            href="/sign-in"
            name="Log in"
            active={pathname.startsWith("/sign-in")}
          />,
          <MenuItem
            key="sign-up"
            as={Link}
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
            <Menu stackable>{items}</Menu>
          </GridColumn>
        </GridRow>
      </Grid>
    </Segment>
  );
}
