import { NavLink } from "react-router-dom";
import { Button, Grid, GridRow, Menu, MenuItem } from "semantic-ui-react";
import { useState } from "react";
import Auth from "../utils/auth";
import LoginSignUpModal from "./loginSignupModal";

function Nav() {
  const [activeItem, setActiveItem] = useState("/");
  // set modal display state
  const [showModal, setShowModal] = useState(false);

  const handleItemClick = (e, { name }) => {
    setActiveItem({ activeItem: name });
  };

  return (
    <>
      <Grid>
        <GridRow>
          <h1>
            <NavLink to="/">Scout Compass</NavLink>
          </h1>
        </GridRow>
        <GridRow>
          <Menu stackable>
            {Auth.loggedIn() ? (
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
                <Button content="Logout" onClick={Auth.logout} />
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
                <Button content="Log in" onClick={() => setShowModal(true)} />
              </>
            )}
          </Menu>
        </GridRow>
      </Grid>
      <LoginSignUpModal showModal={showModal}/>
    </>
  );
}

export default Nav;
