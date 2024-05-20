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

const AllTasks = () => {
 
const { data } = useQuery(QUERY_TASKS);

//list of headers of table
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

//function to ensure data is in text form and ready for a html table
const cleanUpData = (d) => {
  let cleanData = d.map((taskObj) => {
    let newObj = {}
    for (let prop in taskObj) {
      let newVal;
      switch (prop) {
          case "requiredSkills": {
            let tempArr = taskObj[prop].map((skill) => skill.name);
            newVal = tempArr.toString();
            break;
          }
          case "createdBy" || "responsible": {
            newVal = taskObj[prop]?.displayName;
            break;
          }
          case "dueDate": {
            if (taskObj[prop]) {
              newVal = new Date(taskObj[prop]).toLocaleDateString();
            } else {
              newVal = "";
            }
            break;
          }
          default:
            newVal = taskObj[prop];

            break;
        }
        newObj[prop] = newVal;
    }
    return newObj;
  });
  return cleanData;
};

if (data) {
    let tasks = [...data.tasks];
    console.log(tasks)

    let taskArr = [...cleanUpData(tasks)];
    console.log(taskArr)
//render task data
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
