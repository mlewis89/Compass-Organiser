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

export const CREATE_SKILL = gql`
  mutation CreateSkill($skill: createSkillInput!) {
    createSkill(skill: $skill) {
      _id
      name
      parentId
      scope
      groupId
      status
    }
  }
`;

export const UPDATE_SKILL_CATALOG = gql`
  mutation UpdateSkillCatalog($skillId: ID!, $skill: updateSkillCatalogInput!) {
    updateSkillCatalog(skillId: $skillId, skill: $skill) {
      _id
      name
      parentId
      scope
      groupId
      status
      taskCount
      userCount
    }
  }
`;

export const ARCHIVE_SKILL = gql`
  mutation ArchiveSkill($skillId: ID!) {
    archiveSkill(skillId: $skillId) {
      _id
      name
      status
    }
  }
`;

export const REQUEST_PROMOTE_SKILL = gql`
  mutation RequestPromoteSkill($skillId: ID!) {
    requestPromoteSkill(skillId: $skillId) {
      _id
      name
      status
      scope
    }
  }
`;

export const APPROVE_PLATFORM_SKILL = gql`
  mutation ApprovePlatformSkill($skillId: ID!) {
    approvePlatformSkill(skillId: $skillId) {
      _id
      name
      status
    }
  }
`;

export const REJECT_PLATFORM_SKILL = gql`
  mutation RejectPlatformSkill($skillId: ID!) {
    rejectPlatformSkill(skillId: $skillId) {
      _id
      name
      status
    }
  }
`;

export const CREATE_PLATFORM_SKILL = gql`
  mutation CreatePlatformSkill($skill: createSkillInput!) {
    createPlatformSkill(skill: $skill) {
      _id
      name
      parentId
      scope
      status
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

export const SET_TASK_STATUS = gql`
  mutation SetTaskStatus($taskId: ID!, $status: String!) {
    setTaskStatus(taskId: $taskId, status: $status) {
      _id
      status
    }
  }
`;

const EVENT_FIELDS = `
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
  attending {
    _id
    displayName
  }
`;

export const ADD_EVENT = gql`
  mutation AddEvent($eventData: updateEvent!) {
    addEvent(eventData: $eventData) {
      ${EVENT_FIELDS}
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($eventId: ID!, $eventData: updateEvent!) {
    updateEvent(eventId: $eventId, eventData: $eventData) {
      ${EVENT_FIELDS}
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($eventId: ID!) {
    deleteEvent(eventId: $eventId) {
      _id
    }
  }
`;

export const JOIN_EVENT = gql`
  mutation JoinEvent($eventId: ID!) {
    joinEvent(eventId: $eventId) {
      _id
      attending {
        _id
        displayName
      }
    }
  }
`;

export const LEAVE_EVENT = gql`
  mutation LeaveEvent($eventId: ID!) {
    leaveEvent(eventId: $eventId) {
      _id
      attending {
        _id
        displayName
      }
    }
  }
`;

export const SET_EVENT_ATTENDEE = gql`
  mutation SetEventAttendee($eventId: ID!, $userId: ID!, $attending: Boolean!) {
    setEventAttendee(eventId: $eventId, userId: $userId, attending: $attending) {
      _id
      attending {
        _id
        displayName
      }
    }
  }
`;

const BOARD_POST_FIELDS = `
  _id
  title
  content
  image
  isPublic
  expiryDate
  Priority
  createdBy {
    _id
    displayName
  }
`;

export const ADD_BOARD_POST = gql`
  mutation AddBoardPost($postData: updateBoardPost!) {
    addBoardPost(postData: $postData) {
      ${BOARD_POST_FIELDS}
    }
  }
`;

export const UPDATE_BOARD_POST = gql`
  mutation UpdateBoardPost($postId: ID!, $postData: updateBoardPost) {
    updateBoardPost(postId: $postId, postData: $postData) {
      ${BOARD_POST_FIELDS}
    }
  }
`;

export const DELETE_BOARD_POST = gql`
  mutation DeleteBoardPost($postId: ID!) {
    deleteBoardPost(postId: $postId) {
      _id
    }
  }
`;

const MEMBER_FIELDS = `
  _id
  scoutRego
  displayName
  firstName
  lastName
  preferredName
  scoutName
  status
  gender
  dob
  section
  email
  phone
  taskAvailabity
  accountStatus
  role {
    _id
    name
  }
`;

export const INVITE_MEMBER = gql`
  mutation InviteMember($member: addMemberInput!) {
    inviteMember(member: $member) {
      invitationSent
      user {
        ${MEMBER_FIELDS}
      }
    }
  }
`;

export const RESEND_INVITE = gql`
  mutation ResendInvite($userId: ID!) {
    resendInvite(userId: $userId) {
      invitationSent
      user {
        ${MEMBER_FIELDS}
      }
    }
  }
`;

export const SET_MEMBER_STATUS = gql`
  mutation SetMemberStatus($userId: ID!, $status: String!) {
    setMemberStatus(userId: $userId, status: $status) {
      ${MEMBER_FIELDS}
    }
  }
`;

export const REMOVE_MEMBER = gql`
  mutation RemoveMember($userId: ID!) {
    removeMember(userId: $userId) {
      _id
    }
  }
`;

export const UPDATE_MEMBER = gql`
  mutation UpdateMember($userId: ID!, $user: updateUser!) {
    updateMember(userId: $userId, user: $user) {
      ${MEMBER_FIELDS}
    }
  }
`;

export const ASSIGN_MEMBER_ROLE = gql`
  mutation AssignMemberRole($userId: ID!, $roleId: ID!) {
    assignMemberRole(userId: $userId, roleId: $roleId) {
      ${MEMBER_FIELDS}
    }
  }
`;

export const REMOVE_MEMBER_ROLE = gql`
  mutation RemoveMemberRole($userId: ID!, $roleId: ID!) {
    removeMemberRole(userId: $userId, roleId: $roleId) {
      ${MEMBER_FIELDS}
    }
  }
`;

export const CREATE_GROUP = gql`
  mutation CreateGroup($group: createGroupInput!) {
    createGroup(group: $group) {
      _id
      name
      slug
      status
      memberCount
    }
  }
`;

export const UPDATE_GROUP = gql`
  mutation UpdateGroup($groupId: ID!, $group: updateGroupInput!) {
    updateGroup(groupId: $groupId, group: $group) {
      _id
      name
      slug
      status
      memberCount
    }
  }
`;

export const ASSIGN_USER_TO_GROUP = gql`
  mutation AssignUserToGroup($userId: ID!, $groupId: ID!, $roleIds: [ID]) {
    assignUserToGroup(userId: $userId, groupId: $groupId, roleIds: $roleIds) {
      ${MEMBER_FIELDS}
    }
  }
`;

export const REMOVE_USER_FROM_GROUP = gql`
  mutation RemoveUserFromGroup($userId: ID!, $groupId: ID!) {
    removeUserFromGroup(userId: $userId, groupId: $groupId) {
      _id
      email
      displayName
    }
  }
`;
