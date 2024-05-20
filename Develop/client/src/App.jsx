import { Outlet } from "react-router-dom";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { CompassProvider } from "./utils/CompassContext";
import backgoundImage from './assets/contour-white-on-blue.png'

import "./App.css";
import Nav from "./components/Nav";
import { Container, Image } from "semantic-ui-react";
import AuthService from "./utils/auth";


var backgroundStyle = {
  width: "100%",
  height: "400px",
  backgroundImage: "url(" + { backgoundImage } + ")"
};

// Construct request middleware that will attach the JWT token to every request as an `authorization` header
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = AuthService.getToken();
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const httpLink = createHttpLink({
  uri: "/graphql",
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <CompassProvider style={backgroundStyle}>
        <div className="min-100-vh bg-primary">
          <Container>
            <Nav />
            <Outlet />
          </Container>
        </div>
      </CompassProvider>
    </ApolloProvider>
  );
}

export default App;
