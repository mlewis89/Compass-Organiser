import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import { QUERY_TASKS } from "../utils/queries";

const AllTasks = () => {
  const { data } = useQuery(QUERY_TASKS);
  let tasks;

  let TableHeaderArr = [
    "name",
    "description",
    "priority",
    "dueDate",
    "duration",
    "requiredSkills",
    "responsible",
    "status",
  ];
  if (data) {
    //tasks = [...data.tasks];
    let tasks = [
      {
        _id: "66449924403bfae027d87253",
        createdBy: {
          displayName: "Rio",
          __typename: "User",
        },
        description: "packtrailer for camp",
        dueDate: null,
        duration: 2,
        name: "pack trailer",
        priority: 8,
        requiredSkills: [
          {
            name: "Towing a trailer",
            _id: "66449924403bfae027d87207",
            __typename: "Skill",
          },
        ],
        responsible: [],
        status: "inProgress",
        __typename: "Task",
      },
      {
        _id: "66449924403bfae027d87254",
        createdBy: {
          displayName: "Johnathan",
          __typename: "User",
        },
        description: "build a MERN stack application",
        dueDate: null,
        duration: 20,
        name: "build website",
        priority: 3,
        requiredSkills: [
          {
            name: "Web Development",
            _id: "66449924403bfae027d87205",
            __typename: "Skill",
          },
        ],
        responsible: [],
        status: "inProgress",
        __typename: "Task",
      },
      {
        _id: "66449924403bfae027d87255",
        createdBy: {
          displayName: "Rio",
          __typename: "User",
        },
        description: "deep clean and reseason",
        dueDate: null,
        duration: 2,
        name: "clean bbq after camp",
        priority: 7,
        requiredSkills: [
          {
            name: "General Help",
            _id: "66449924403bfae027d8720d",
            __typename: "Skill",
          },
        ],
        responsible: [],
        status: "toDo",
        __typename: "Task",
      },
      {
        _id: "66449924403bfae027d87256",
        createdBy: {
          displayName: "Jeswin",
          __typename: "User",
        },
        description: "diagnose and fix",
        dueDate: null,
        duration: 2,
        name: "fix camp lights",
        priority: 5,
        requiredSkills: [
          {
            name: "Trades",
            _id: "66449924403bfae027d8720e",
            __typename: "Skill",
          },
        ],
        responsible: [],
        status: "inProgress",
        __typename: "Task",
      },
      {
        _id: "66449924403bfae027d87257",
        createdBy: {
          displayName: "Keo",
          __typename: "User",
        },
        description: "new tap in male bathroom",
        dueDate: null,
        duration: 2,
        name: "Plumbing at hall",
        priority: 7,
        requiredSkills: [
          {
            name: "Trades",
            _id: "66449924403bfae027d8720e",
            __typename: "Skill",
          },
        ],
        responsible: [],
        status: "toDo",
        __typename: "Task",
      },
      {
        _id: "66449924403bfae027d87258",
        createdBy: {
          displayName: "William",
          __typename: "User",
        },
        description: "choose date",
        dueDate: null,
        duration: 10,
        name: "Organise Social event",
        priority: 5,
        requiredSkills: [
          {
            name: "Admin",
            _id: "66449924403bfae027d87209",
            __typename: "Skill",
          },
        ],
        responsible: [],
        status: "toDo",
        __typename: "Task",
      },
      {
        _id: "66449924403bfae027d87259",
        createdBy: {
          displayName: "Rio",
          __typename: "User",
        },
        description: "email; parents",
        dueDate: null,
        duration: 2,
        name: "Transport for schout hike",
        priority: 6,
        requiredSkills: [
          {
            name: "Admin",
            _id: "66449924403bfae027d87209",
            __typename: "Skill",
          },
        ],
        responsible: [],
        status: "toDo",
        __typename: "Task",
      },
      {
        _id: "66449924403bfae027d8725a",
        createdBy: {
          displayName: "Brayden",
          __typename: "User",
        },
        description: "purchase and replace items",
        dueDate: null,
        duration: 5,
        name: "restock first aid kits",
        priority: 6,
        requiredSkills: [
          {
            name: "Admin",
            _id: "66449924403bfae027d87209",
            __typename: "Skill",
          },
        ],
        responsible: [],
        status: "complete",
        __typename: "Task",
      },
      {
        _id: "66449924403bfae027d8725b",
        createdBy: {
          displayName: "Brian",
          __typename: "User",
        },
        description: "inside and outside hall",
        dueDate: null,
        duration: 10,
        name: "Paint hall",
        priority: 2,
        requiredSkills: [
          {
            name: "Trades",
            _id: "66449924403bfae027d8720e",
            __typename: "Skill",
          },
        ],
        responsible: [],
        status: "inProgress",
        __typename: "Task",
      },
    ];

    tasks.map((taskObj) => {
      for (let prop in taskObj) {
        if (typeof taskObj[prop] === "object") {
          //console.log(prop, taskObj[prop]);
          let stringVal = "";
          switch (prop) {
            case "requiredSkills": {
              let tempArr = taskObj[prop].map((skill) => skill.name);
              stringVal = tempArr.toString();
              delete taskObj["requiredSkills"];
              break;
            }
            case "createdBy": {
              stringVal = taskObj[prop].displayName;
              delete taskObj["createdBy"];
              break;
            }
            case "responsible": {
              let tempArr = taskObj[prop].map((user) => user.displayName);
              stringVal = tempArr.toString();
              delete taskObj["responsible"];
              break;
            }
            case "dueDate": {
              if (taskObj[prop]) {
                stringVal = new Date(taskObj[prop]).toLocaleDateString();
              } else {
                stringVal = "";
              }
              delete taskObj["dueDate"];
              break;
            }
            default:
              break;
          }

          //console.log(stringVal);
          taskObj[prop] = stringVal;
        }
        /*
          console.log(taskObj[prop]);
          taskObj[prop] = JSON.stringify(taskObj[prop]);
          console.log(taskObj[prop]);
        }*/
      }
      return taskObj;
    });

    let taskArr = [...tasks];

    return (
      <Table celled selectable>
        <TableHeader>
          <TableRow>
            {TableHeaderArr.map((header) => (
              <TableHeaderCell key={header}>{header}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        {taskArr ? (
          <TableBody>
            {taskArr.map((task) => (
              <TableRow key={task._id}>
                {TableHeaderArr.map((propertyName) => (
                  <TableCell key={task._id + propertyName}>
                    {task[propertyName]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        ) : (
          <></>
        )}
      </Table>
    );
  } else {
    return <p>Loading</p>;
  }
};

export default AllTasks;
