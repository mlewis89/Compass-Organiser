import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Segment,
  Label,
} from "semantic-ui-react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_SUGGESTED_TASKS } from "../utils/queries";
import { ADD_USER_TASK } from "../utils/mutations";

const SuggestedTasks = () => {
  const { data } = useQuery(QUERY_SUGGESTED_TASKS);
  const [addUserTask, { error }] = useMutation(ADD_USER_TASK);

  const handleAddTask = (event, data) => {
    let _id = data["data-key"];
    addUserTask({ variables: { taskId: _id } });
  };

  let tasks;

  let TableHeaderArr = [
    "name",
    "description",
    "priority",
    //"dueDate",
    "duration",
    //   "requiredSkills",
    //   "responsible",
    //"status",
  ];
  if (data) {
    tasks = [...data.suggestedTasks];
    console.log(tasks);
  }

  return (
    <Segment padded>
      <Label attached="top">Suggested Tasks</Label>
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
                <TableCell>
                  <Button
                    data-key={task._id}
                    key={task._id}
                    onClick={handleAddTask}
                  >
                    Add Task
                  </Button>
                </TableCell>
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

export default SuggestedTasks;
