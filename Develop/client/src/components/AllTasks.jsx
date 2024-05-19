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
import { useCompassContext } from "../utils/CompassContext";

const AllTasks = () => {

  const [state, dispatch] = useCompassContext();
 
//const { data } = useQuery(QUERY_TASKS);

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
          case "createdBy": {
            newVal = taskObj[prop]?.displayName;
            break;
          }
          case "responsible": {
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

        //console.log(stringVal);
        newObj[prop] = newVal;
      
      /*
        console.log(taskObj[prop]);
        taskObj[prop] = JSON.stringify(taskObj[prop]);
        console.log(taskObj[prop]);
      }*/
    }
    return newObj;
  });
  return cleanData;
};

if (state.allTasks) {
    let tasks = [...state.allTasks];

    //let tasks = sampleTaskData;


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
