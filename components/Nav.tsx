"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Grid,
  GridColumn,
  GridRow,
  Image,
  Menu,
  MenuItem,
  Segment,
} from "semantic-ui-react";
import Auth from "@/lib/client/auth";
import LoginSignUpModal from "@/components/LoginSignUpModal";

export default function Nav() {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Auth.loggedIn());
  }, []);

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
              {loggedIn ? (
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
                  <MenuItem
                    content="Log out"
                    onClick={() => {
                      Auth.logout();
                      setLoggedIn(false);
                    }}
                  />
                </>
              ) : (
                <>
                  <MenuItem as={Link} href="/" name="Home" active={pathname === "/"} />
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
                  <MenuItem content="Log in" onClick={() => setShowModal(true)} />
                </>
              )}
            </Menu>
          </GridColumn>
        </GridRow>
      </Grid>
      <LoginSignUpModal showModal={showModal} setShowModal={setShowModal} />
    </Segment>
  );
}
