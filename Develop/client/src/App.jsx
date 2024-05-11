
import { Outlet } from 'react-router-dom';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';

import './App.css';
import Nav from './components/Nav'
import { Container } from 'semantic-ui-react';

const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="min-100-vh bg-primary">
      <Container >
        <Nav />
        <Outlet />
      </Container>
      </div>
    </ApolloProvider>
  );
}

export default App;
