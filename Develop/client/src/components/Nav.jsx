import { NavLink } from "react-router-dom";
import { Button, Grid, GridRow, Menu, MenuItem } from "semantic-ui-react";
import { useState } from "react";

function Nav() {
  const [ activeItem, setActiveItem ] = useState("/");
  const [ loggedIn ,setloggedIn] = useState({state:false}); ////TEMP

  const handleItemClick = (e, { name }) => {
    setActiveItem({ activeItem: name });
  };

  const handleLoginItemClick = () => {
    setloggedIn(!loggedIn)
  }

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
                to="/dashboard"
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
              <Button
                content="Logout"
                onClick={handleLoginItemClick}
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
              <Button
                content="Log in"
                onClick={handleLoginItemClick}
              />
            </>
          )}
        </Menu>
      </GridRow>
    </Grid>
  );
}

export default Nav;
