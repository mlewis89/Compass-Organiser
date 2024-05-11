import { NavLink } from "react-router-dom";
import { Grid, GridRow, Menu, MenuItem } from "semantic-ui-react";
import { useState } from "react";

function Nav() {
  const { activeItem, setActiveItem } = useState("/");

  const handleItemClick = (e, { name }) => {
    setActiveItem({ activeItem: name });
  };

  const loggedIn = false;

  return (
    <Grid>
      <GridRow>
        <h1>
          <NavLink to="/">Scout Compass</NavLink>
        </h1>
      </GridRow>
      <GridRow>
        <Menu stackable>
          {loggedIn ? (
            <>
              <MenuItem
                as={NavLink}
                to="/"
                name="Dashboard"
                active={activeItem === "dashboard"}
                onClick={handleItemClick}
              />
              <MenuItem
                as={NavLink}
                to="/tasks"
                name="Tasks"
                active={activeItem === "tasks"}
                onClick={handleItemClick}
              />
              <MenuItem
                as={NavLink}
                to="/events"
                name="Events"
                active={activeItem === "events"}
                onClick={handleItemClick}
              />
              <MenuItem
                as={NavLink}
                to="/members"
                name="members"
                active={activeItem === "members"}
                onClick={handleItemClick}
              />
              <MenuItem
                as={NavLink}
                to="/logout"
                name="Logout"
                active={activeItem === "logout"}
                onClick={handleItemClick}
              />
            </>
          ) : (
            <>
              <MenuItem
                as={NavLink}
                to="/"
                name="Home"
                active={activeItem === "home"}
                onClick={handleItemClick}
              />
              <MenuItem
                as={NavLink}
                to="/about"
                name="About"
                active={activeItem === "about"}
                onClick={handleItemClick}
              />
              <MenuItem
                as={NavLink}
                to="/contact"
                name="Contact"
                active={activeItem === "contact"}
                onClick={handleItemClick}
              />
              <MenuItem
                as={NavLink}
                to="/login"
                name="Login In"
                active={activeItem === "login"}
                onClick={handleItemClick}
              />
            </>
          )}
        </Menu>
      </GridRow>
    </Grid>
  );
}

export default Nav;
