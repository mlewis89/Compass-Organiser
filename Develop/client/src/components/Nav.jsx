
import { Link } from "react-router-dom";

function Nav() {


    
  return (
    <header className="flex-row px-1">
      <h1>
        <Link to="/">
          Scout Compass
        </Link>
      </h1>

      <nav>
        NAV
      </nav>
    </header>
  );
}

export default Nav;
