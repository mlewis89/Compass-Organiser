import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Segment,
  Label,
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import { QUERY_TASKS } from "../utils/queries";

import sampleTaskData from "./AllTask_SampleData.json";

const AllTasks = () => {
  const cleanUpData = (d) => {
    let cleanData = d.map((taskObj) => {
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
    return cleanData;
  };

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
    let tasks = sampleTaskData;

    let taskArr = [...cleanUpData(tasks)];

    return (
      <Segment padded>
        <Label attached="top">All Tasks</Label>
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
      </Segment>
    );
  } else {
    return <p>Loading</p>;
  }
};

export default AllTasks;
