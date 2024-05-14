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

