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

export const ADD_BOARDPOST = gql`
mutation AddBoardPost($postData: updateBoardPost!) {
  addBoardPost(postData: $postData) {
    Priority
    _id
    content
    expiryDate
    image
    isPublic
    title
  }
}
`;
export const UPDATE_BOARDPOST = gql`
mutation UpdateBoardPost($postId: ID!, $postData: updateBoardPost) {
  updateBoardPost(postId: $postId, postData: $postData) {
    Priority
    _id
    content
    expiryDate
    image
    isPublic
    title
  }
}
`;
export const DELETE_BOARDPOST = gql`
mutation DeleteBoardPost($postId: ID!) {
  deleteBoardPost(postId: $postId) {
    Priority
    _id
    content
    expiryDate
    image
    isPublic
    title
  }
}
`;

export const ADD_EVENT = gql`
mutation AddEvent($eventData: updateEvent!) {
  addEvent(eventData: $eventData) {
    _id
    title
    organisor {
      _id
      displayName
    }
    startDate
    endDate
    isPublic
    description
    location
    plan
    riskManagement
    status
    cost
  }
}
`;
export const UPDATE_EVENT = gql`
mutation UpdateEvent($eventId: ID!, $eventData: updateEvent!) {
  updateEvent(eventId: $eventId, eventData: $eventData) {
    _id
    title
    organisor {
      displayName
      _id
    }
    startDate
    endDate
    isPublic
    description
    location
    plan
    riskManagement
    status
    cost
  }
}
`;
export const DELETE_EVENT = gql`
mutation DeletEvent($eventId: ID!) {
  deletEvent(eventId: $eventId) {
    _id
    title
    startDate
    endDate
    isPublic
    description
    location
    attending {
      _id
      displayName
    }
    organisor {
      _id
      displayName
    }
    plan
    riskManagement
    status
    cost
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
