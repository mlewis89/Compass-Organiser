import { gql } from '@apollo/client';

export const QUERY_BOARDPOST = gql`
query boardPosts {
  boardPosts {
    title
    isPublic
    image
    expiryDate
    createdBy {
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
      firstName
      preferredName
      scoutName
    }
    startDate
    endDate
    isPublic
    description
    location
    attending {
      _id
      scoutName
      preferredName
      lastName
      firstName
    }
    plan
    riskManagement
    status
    cost
  }
}
`;

export const QUERY_SINGLE_EVENT = gql`
query SingleEvent($eventId: ID!) {
  singleEvent(eventID: $eventId) {
    _id
    title
    organisor {
      firstName
      lastName
      _id
      preferredName
      scoutName
    }
    startDate
    endDate
    isPublic
    description
    location
    attending {
      _id
      scoutRego
      firstName
      lastName
      preferredName
      scoutName
      status
      gender
      Section
      email
      phone
      Family {
        _id
      }
      ParentGardian {
        _id
        firstName
      }
    }
    plan
    riskManagement
    status
    cost
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
      preferredName
    }
    Priority
    requiredSkills {
      _id
      name
    }
    createdBy {
      firstName
      lastName
      preferredName
      scoutName
    }
  }
}
`;

export const QUERY_SUGGESTED_TASKS = gql`
query SuggestedTasks {
  suggestedTasks {
    _id
    Name
    requiredSkills {
      _id
      name
    }
    dueDate
    duration
    Priority
  }
}
`;

export const QUERY_TASKS = gql`
query Tasks {
  tasks {
    name
    priority
    _id
    description
    status
    dueDate
    duration
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
    Section
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

export const QUERY_ME_SKILLS = gql`
query Members {
  me {
    skills {
      name
    }
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
      requiredSkills {
        name
        _id
      }
      status
    }
  }
}
`;

export const QUERY_ME = gql`
query Me {
  me {
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



