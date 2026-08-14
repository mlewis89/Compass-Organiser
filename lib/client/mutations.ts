import { gql } from "@apollo/client";

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
  mutation RemoveUserFromTask($taskId: ID!) {
    removeUserFromTask(taskId: $taskId) {
      _id
      displayName
      myTasks {
        _id
        name
        status
        priority
        duration
        dueDate
        description
      }
    }
  }
`;

export const ADD_TASK = gql`
  mutation AddTask($taskData: updateTask!) {
    addTask(taskData: $taskData) {
      _id
      name
      requiredSkills {
        name
        _id
      }
      dueDate
      duration
      responsible {
        _id
        displayName
      }
      priority
      description
      status
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($taskId: ID!, $taskData: updateTask!) {
    updateTask(taskId: $taskId, taskData: $taskData) {
      _id
      name
      requiredSkills {
        name
        _id
      }
      dueDate
      duration
      responsible {
        _id
        displayName
      }
      priority
      description
      status
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($taskId: ID!) {
    deleteTask(taskId: $taskId) {
      _id
      name
      dueDate
      duration
      responsible {
        _id
        displayName
      }
      priority
      description
      status
    }
  }
`;
