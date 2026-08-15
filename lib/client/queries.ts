import { gql } from "@apollo/client";

export const QUERY_PUBLIC_GROUP = gql`
  query PublicGroup($slug: String!) {
    publicGroup(slug: $slug) {
      _id
      name
      slug
      status
    }
  }
`;

export const QUERY_BOARDPOST = gql`
  query boardPosts($groupSlug: String) {
    boardPosts(groupSlug: $groupSlug) {
      title
      isPublic
      image
      expiryDate
      createdBy {
        displayName
        scoutName
        _id
        firstName
        preferredName
      }
      content
      _id
      Priority
    }
  }
`;

export const QUERY_EVENTS = gql`
  query Events($groupSlug: String) {
    events(groupSlug: $groupSlug) {
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
      status
    }
  }
`;

export const QUERY_SINGLE_EVENT = gql`
  query SingleEvent($eventId: ID!, $groupSlug: String) {
    singleEvent(eventId: $eventId, groupSlug: $groupSlug) {
      _id
      attending {
        _id
        displayName
      }
      cost
      description
      endDate
      isPublic
      location
      organisor {
        displayName
      }
      plan
      riskManagement
      startDate
      status
      title
    }
  }
`;

export const QUERY_SINGLE_TASK = gql`
  query SingleTask($taskId: ID!) {
    singleTask(taskId: $taskId) {
      _id
      name
      requiredSkills {
        _id
        name
        isActiveForUser
      }
      dueDate
      duration
      responsible {
        _id
        displayName
      }
      createdBy {
        _id
        displayName
      }
      priority
      description
      status
    }
  }
`;

export const QUERY_SUGGESTED_TASKS = gql`
  query SuggestedTasks($userId: ID, $userSkills: [updateSkill], $numberOfTasks: Int) {
    suggestedTasks(userId: $userId, userSkills: $userSkills, numberOfTasks: $numberOfTasks) {
      _id
      name
      dueDate
      duration
      requiredSkills {
        _id
        name
      }
      responsible {
        displayName
        _id
      }
      createdBy {
        _id
        displayName
      }
      priority
      description
      status
    }
  }
`;

export const QUERY_TASKS = gql`
  query Tasks {
    tasks {
      _id
      createdBy {
        displayName
      }
      description
      dueDate
      duration
      name
      priority
      requiredSkills {
        name
        _id
      }
      responsible {
        displayName
      }
      status
    }
  }
`;

export const QUERY_MEMBERS = gql`
  query Members {
    members {
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
    }
  }
`;

export const QUERY_ME_TIME = gql`
  query MeTime {
    me {
      _id
      taskAvailabity
    }
  }
`;

export const QUERY_USER_SKILLS = gql`
  query PageSkills($userId: ID) {
    pageSkills(userId: $userId) {
      _id
      isActiveForUser
      name
    }
  }
`;

export const QUERY_ME_TASKS = gql`
  query MeTasks {
    me {
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

export const QUERY_ME_STATS = gql`
  query MyStats($userId: ID) {
    myStats(userId: $userId) {
      value
      name
    }
  }
`;

export const QUERY_MY_PERMISSIONS = gql`
  query MyPermissions {
    myPermissions {
      roles
      canManageTasks
      canManageEvents
      canManagePosts
      canManageMembers
      isPlatformAdmin
    }
  }
`;

export const QUERY_MY_GROUPS = gql`
  query MyGroups {
    myGroups {
      _id
      name
      slug
      status
    }
    activeGroup {
      _id
      name
      slug
      status
    }
  }
`;

export const QUERY_ADMIN_GROUPS = gql`
  query AdminGroups {
    adminGroups {
      _id
      name
      slug
      status
      memberCount
    }
  }
`;

export const QUERY_ORPHANED_USERS = gql`
  query OrphanedUsers {
    orphanedUsers {
      _id
      displayName
      firstName
      lastName
      email
      accountStatus
    }
  }
`;

export const QUERY_ADMIN_GROUP_MEMBERS = gql`
  query AdminGroupMembers($groupId: ID!) {
    adminGroupMembers(groupId: $groupId) {
      _id
      displayName
      firstName
      lastName
      email
      accountStatus
      role {
        _id
        name
      }
    }
  }
`;

export const QUERY_ROLES = gql`
  query Roles {
    roles {
      _id
      name
      isUniformed
    }
  }
`;

export const QUERY_SINGLE_MEMBER = gql`
  query SingleMember($userId: ID!) {
    singleMember(userId: $userId) {
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
    }
  }
`;
