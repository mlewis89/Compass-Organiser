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
    <Segment padded>
      <Label attached="top">My Tasks</Label>

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
    </Segment>
  );
};

export default MyTasks;
