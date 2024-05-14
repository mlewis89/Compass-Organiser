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
    tasks = data.tasks;
    console.log(TableHeaderArr);
    console.log(tasks);
  }

  return (
    <Table celled selectable>
      <TableHeader>
        <TableRow>
          {TableHeaderArr.map((header) => (
            <TableHeaderCell key={header}>{header}</TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      {tasks ? (
        <TableBody>
          {tasks.map((task) => (
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
};

export default AllTasks;
