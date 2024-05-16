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

export const ASSIGN_USER_SKILLS = gql`
mutation AssignUserSkill($skillId: ID, $userId: ID) {
  assignUserSkill(skillId: $skillId, userId: $userId) {
    displayName
    _id
    skills {
      name
      _id
    }
  }
}
`;

export const REMOVE_USER_SKILLS = gql`
mutation RemoveUserSkill($skillId: ID, $userId: ID) {
  removeUserSkill(skillId: $skillId, userId: $userId) {
    displayName
    _id
    skills {
      name
      _id
    }
  }
}
`;

export const ASSIGN_USER_TASK = gql`
mutation AssignUserTask($taskId: ID!) {
  assignUserTask(taskId: $taskId) {
    _id
    displayName
    myTasks {
      _id
      description
      dueDate
      duration
      name
      priority
      status
    }
  }
}
`;
export const REMOVE_USER_TASK = gql`
`;

export const ADD_BOARDPOST = gql`
`;
export const UPDATE_BOARDPOST = gql`
`;
export const DELETE_BOARDPOST = gql`
`;

export const ADD_EVENT = gql`
`;
export const UPDATE_EVENT = gql`
`;
export const DELETE_EVENT = gql`
`;

export const ADD_TASK = gql`
`;
export const UPDATE_TASK = gql`
`;
export const DELETE_TASK = gql`
`;
