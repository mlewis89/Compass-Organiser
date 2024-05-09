
import { Link } from "react-router-dom";

function Nav() {


    
  return (
    <header className="flex-row px-1">
      <h1>
        <Link to="/">
          <span role="img" aria-label="shopping bag">🛍️</span>
          -Shop-Shop
        </Link>
      </h1>

      <nav>
        NAV
      </nav>
    </header>
  );
}

export default Nav;
