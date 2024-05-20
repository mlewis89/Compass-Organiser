import { NavLink } from "react-router-dom";
import { GridColumn, Grid, GridRow, Image, Menu, MenuItem, Segment } from "semantic-ui-react";
import { useState } from "react";
import Auth from "../utils/auth";
import LoginSignUpModal from "./loginSignupModal";
import headerImage from '../assets/header.png';
import pathImage from '../assets/path.png';

function Nav() {

  const [activeItem, setActiveItem] = useState("/");
  // set modal display state
  const [showModal, setShowModal] = useState(false);

  const handleItemClick = (e, { name }) => {
    setActiveItem({ activeItem: name });
  };

  return (
      <Segment>
      <Grid columns={3} stackable>
        <GridRow>
          <GridColumn width={5} verticalAlign="middle">
          <Image
          src={headerImage} 
          size='medium' 
          alt='Compass Organisor' />
          </GridColumn>
          <GridColumn width={4}  only='tablet computer'>
          <Image src={pathImage} />
          </GridColumn>
        <GridColumn width={7} verticalAlign="bottom">
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
                <MenuItem content="Log out" onClick={Auth.logout} />
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
                <MenuItem content="Log in" onClick={() => setShowModal(true)} />
              </>
            )}
          </Menu>
          </GridColumn>
        </GridRow>
      </Grid>
      <LoginSignUpModal showModal={showModal} setShowModal={setShowModal}/>
      </Segment>
  );
}

export default Nav;
