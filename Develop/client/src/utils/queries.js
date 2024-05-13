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
    _id
    Name
    requiredSkills {
      _id
      name
    }
    dueDate
    duration
    responsible {
      firstName
      _id
    }
    createdBy {
      preferredName
      scoutName
    }
    Priority
  }
}
`;

export const QUERY_MEMBERS = gql`
query Members {
  members {
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




/*
        events: [Event],
        boardPosts: [BoardPost],
        publicBoardPosts: [BoardPost],
        publicEvents: [Event],
        suggestedTasks(UserID:ID!): [Tasks],
        members: [User],
        me: User
*/