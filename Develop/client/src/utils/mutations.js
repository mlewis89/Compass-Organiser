import { gql } from '@apollo/client';

export const ADD_USER = gql`
mutation Mutation($user: addUser!) {
  addUser(user: $user) {
    token
    user {
      _id
      email
      firstName
      lastName
    }
  }
}
`;

export const CREATE_VOTE = gql`
  mutation createVote($_id: String!, $techNum: Int!) {
    createVote(_id: $_id, techNum: $techNum) {
      _id
      tech1
      tech2
      tech1_votes
      tech2_votes
    }
  }
`;
