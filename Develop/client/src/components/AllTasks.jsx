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
          "_id": "664471c0f8a1e76ed9129bb3",
          "createdBy": {
              "displayName": "Alieu",
              "__typename": "User"
          },
          "description": "packtrailer for camp",
          "dueDate": null,
          "duration": 2,
          "name": "pack trailer",
          "priority": 8,
          "requiredSkills": [
              {
                  "name": "Web Development",
                  "_id": "664471bff8a1e76ed9129b63",
                  "__typename": "Skill"
              }
          ],
          "responsible": [
              {
                  "displayName": "Majid",
                  "__typename": "User"
              }
          ],
          "status": "inProgress",
          "__typename": "Task"
      },
      {
          "_id": "664471c0f8a1e76ed9129bb4",
          "createdBy": {
              "displayName": "Theo",
              "__typename": "User"
          },
          "description": "build a MERN stack application",
          "dueDate": null,
          "duration": 20,
          "name": "build website",
          "priority": 3,
          "requiredSkills": [
              {
                  "name": "Web Development",
                  "_id": "664471bff8a1e76ed9129b63",
                  "__typename": "Skill"
              }
          ],
          "responsible": [
          ],
          "status": "inProgress",
          "__typename": "Task"
      },
      {
          "_id": "664471c0f8a1e76ed9129bb5",
          "createdBy": {
              "displayName": "Thorben",
              "__typename": "User"
          },
          "description": "deep clean and reseason",
          "dueDate": null,
          "duration": 2,
          "name": "clean bbq after camp",
          "priority": 7,
          "requiredSkills": [
              {
                  "name": "Power Tools",
                  "_id": "664471bff8a1e76ed9129b64",
                  "__typename": "Skill"
              }
          ],
          "responsible": [
          ],
          "status": "toDo",
          "__typename": "Task"
      },
      {
          "_id": "664471c0f8a1e76ed9129bb6",
          "createdBy": {
              "displayName": "Hussnain",
              "__typename": "User"
          },
          "description": "diagnose and fix",
          "dueDate": null,
          "duration": 2,
          "name": "fix camp lights",
          "priority": 5,
          "requiredSkills": [
              {
                  "name": "Web Development",
                  "_id": "664471bff8a1e76ed9129b63",
                  "__typename": "Skill"
              }
          ],
          "responsible": [
          ],
          "status": "inProgress",
          "__typename": "Task"
      },
      {
          "_id": "664471c0f8a1e76ed9129bb7",
          "createdBy": {
              "displayName": "Zi",
              "__typename": "User"
          },
          "description": "new tap in male bathroom",
          "dueDate": null,
          "duration": 2,
          "name": "Plumbing at hall",
          "priority": 7,
          "requiredSkills": [
              {
                  "name": "Web Development",
                  "_id": "664471bff8a1e76ed9129b63",
                  "__typename": "Skill"
              }
          ],
          "responsible": [
              {
                  "displayName": "Kaylum",
                  "__typename": "User"
              }
          ],
          "status": "toDo",
          "__typename": "Task"
      },
      {
          "_id": "664471c0f8a1e76ed9129bb8",
          "createdBy": {
              "displayName": "Nyah",
              "__typename": "User"
          },
          "description": "choose date",
          "dueDate": null,
          "duration": 10,
          "name": "Organise Social event",
          "priority": 5,
          "requiredSkills": [
              {
                  "name": "Web Development",
                  "_id": "664471bff8a1e76ed9129b63",
                  "__typename": "Skill"
              }
          ],
          "responsible": [
              {
                  "displayName": "Pushkar",
                  "__typename": "User"
              }
          ],
          "status": "toDo",
          "__typename": "Task"
      },
      {
          "_id": "664471c0f8a1e76ed9129bb9",
          "createdBy": {
              "displayName": "Shahmir",
              "__typename": "User"
          },
          "description": "email; parents",
          "dueDate": null,
          "duration": 2,
          "name": "Transport for schout hike",
          "priority": 6,
          "requiredSkills": [
              {
                  "name": "Power Tools",
                  "_id": "664471bff8a1e76ed9129b64",
                  "__typename": "Skill"
              }
          ],
          "responsible": [
              {
                  "displayName": "Aiden-Jack",
                  "__typename": "User"
              }
          ],
          "status": "toDo",
          "__typename": "Task"
      },
      {
          "_id": "664471c0f8a1e76ed9129bba",
          "createdBy": {
              "displayName": "Lorne",
              "__typename": "User"
          },
          "description": "purchase and replace items",
          "dueDate": null,
          "duration": 5,
          "name": "restock first aid kits",
          "priority": 6,
          "requiredSkills": [
              {
                  "name": "Power Tools",
                  "_id": "664471bff8a1e76ed9129b64",
                  "__typename": "Skill"
              }
          ],
          "responsible": [
              {
                  "displayName": "Ricco",
                  "__typename": "User"
              }
          ],
          "status": "complete",
          "__typename": "Task"
      },
      {
          "_id": "664471c0f8a1e76ed9129bbb",
          "createdBy": {
              "displayName": "Ricco",
              "__typename": "User"
          },
          "description": "inside and outside hall",
          "dueDate": null,
          "duration": 10,
          "name": "Pait hall",
          "priority": 2,
          "requiredSkills": [
              {
                  "name": "Web Development",
                  "_id": "664471bff8a1e76ed9129b63",
                  "__typename": "Skill"
              }
          ],
          "responsible": [
              {
                  "displayName": "Caley",
                  "__typename": "User"
              }
          ],
          "status": "inProgress",
          "__typename": "Task"
      }
  ]
    
    tasks.map((taskObj) => {
      for (let prop in taskObj) {
        if (typeof taskObj[prop] === "object") {
          console.log(prop, taskObj[prop]);
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
              delete taskObj["createdBy"]
              break;
            }
            case "responsible": {
              let tempArr = taskObj[prop].map((user) => user.displayName);
              stringVal = tempArr.toString();
              delete taskObj["responsible"]
              break;
            }
            case "dueDate": {
              if (taskObj[prop]) {
                stringVal = new Date(taskObj[prop]).toLocaleDateString();
              } else {
                stringVal = "";
              }
              delete taskObj["dueDate"]
              break;
            }
            default:
              break;
          }
          
          console.log(stringVal);
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

    let taskArr = [
      {
          "_id": "664471c0f8a1e76ed9129bb3",
          "description": "packtrailer for camp",
          "dueDate": null,
          "duration": 2,
          "name": "pack trailer",
          "priority": 8,
          "status": "inProgress",
          "__typename": "Task"
      },
      {
          "_id": "664471c0f8a1e76ed9129bb4",
          "description": "build a MERN stack application",
          "dueDate": null,
          "duration": 20,
          "name": "build website",
          "priority": 3,
          "status": "inProgress",
          "__typename": "Task"
      }];

      taskArr = [...tasks];

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
