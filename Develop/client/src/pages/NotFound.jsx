import { useLocation } from "react-router-dom";
import Nav from "../components/Nav";
import { Container ,Segment} from "semantic-ui-react";

function NotFound() {
  let location = useLocation();
  return (
    <div className="min-100-vh bg-primary">
      <Container>
        <Nav />
        <Segment text>
          <h1>
            Error: No match for <code>{location.pathname}</code>
          </h1>
        </Segment>
      </Container>
    </div>
  );
}

export default NotFound;
