import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import { QUERY_ME_TASKS } from "../utils/queries";

const MyTasks = () => {
  const { data } = useQuery(QUERY_ME_TASKS);
  let tasks;

  let TableHeaderArr = [
    "name",
    "description",
    "priority",
    "dueDate",
    "duration",
    "status",
  ];
  if (data) {
    tasks = data.me.myTasks;

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

export default MyTasks;
