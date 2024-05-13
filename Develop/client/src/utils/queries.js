import { gql } from '@apollo/client';

export const QUERY_EVENTS = gql`
  query events {
    tech {
      _id
      name
    }
  }
`;

export const QUERY_MATCHUPS = gql`
  query matchups($_id: String) {
    matchups(_id: $_id) {
      _id
      tech1
      tech2
      tech1_votes
      tech2_votes
    }
  }
`;


/*
        events: [Event],
        boardPosts: [BoardPost],
        publicBoardPosts: [BoardPost],
        publicEvents: [Event],
        suggestedTasks(UserID:ID!): [Tasks],
        members: [User],
        me: User
*/