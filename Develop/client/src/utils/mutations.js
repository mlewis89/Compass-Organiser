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

export const LOGIN = gql`
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      displayName
      _id
      firstName
      lastName
    }
  }
}
`;

export const UPDATE_ME_TIME = gql`
mutation UpdateUserTime($taskAvailabity: Int!) {
  updateUserTime(taskAvailabity: $taskAvailabity) {
    taskAvailabity
  }
}
`;