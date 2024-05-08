//include external libraries
const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { path } = require("path");

//include local definitions
const { typeDefs, resolvers } = require("./schemas");
const db = require("./config/connection");

//define Server port
const PORT = process.env.PORT || 3001;

//create express and appolo instances
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const startApolloServer = async () => {
  await server.start();
  //Middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use("/graphql", expressMiddleware(server));
  //if Production build - serve client/dist as static
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
  }

  db.once("open", () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Apollo Server Sandbox running at http://localhost:${PORT}/graphql`);
      console.log(`Application running at http://localhost:${PORT}`);
    });
  });
};