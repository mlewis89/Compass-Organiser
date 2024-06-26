import { gql } from '@apollo/client';

export const QUERY_BOARDPOST = gql`
query boardPosts {
  boardPosts {
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
query Events {
  events {
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
query SingleEvent($eventId: ID!) {
  singleEvent(eventId: $eventId) {
    _id
    attending {
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

export const QUERY_USER_TASKS = gql`
query UserTasks {
  userTasks {
    _id
    Name
    dueDate
    duration
    responsible {
      _id
      displayName
    }
    Priority
    requiredSkills {
      _id
      name
    }
    createdBy {
      displayName
    }
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
query Query($userId: ID, $userSkills: [updateSkill], $numberOfTasks: Int) {
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
  }
}
`;
export const QUERY_ME_TIME = gql`
query Members {
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
query Members {
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

export const QUERY_ME = gql`
query Me {
  me {
    _id
    displayName
    scoutRego
    firstName
    lastName
    preferredName
    scoutName
    status
    gender
    dob
    Section
    email
    phone
    taskAvailabity
    Family {
      _id
      users {
        _id
        scoutRego
        firstName
        lastName
        preferredName
        scoutName
        status
        gender
        dob
        Section
        email
        phone
        taskAvailabity
      }
    }
    ParentGardian {
      _id
      scoutRego
      firstName
      lastName
      preferredName
      scoutName
      status
      gender
      dob
      Section
      email
      phone
      taskAvailabity
    }
    role {
      _id
      name
      prequistes
      RequiredTraining
      ReportsTo {
        _id
        name
        prequistes
        RequiredTraining
        isUniformed
      }
      isUniformed
    }
    skills {
      _id
      name
    }
    myTasks {
      _id
      Name
      requiredSkills {
        _id
        name
      }
      dueDate
      duration
      responsible {
        _id
        scoutRego
        firstName
        lastName
        preferredName
        scoutName
        status
        gender
        dob
        Section
        email
        phone
        taskAvailabity
      }
      createdBy {
        _id
        scoutRego
        firstName
        lastName
        preferredName
        scoutName
        status
        gender
        dob
        Section
        email
        phone
        taskAvailabity
      }
      Priority
    }
  }
}
`;



