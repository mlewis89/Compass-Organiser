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
import { useCompassContext } from "../utils/CompassContext";
import { UPDATE_RERENDER_MYTASKS } from "../utils/actions";

const MyTasks = () => {
  
  const [state, dispatch] = useCompassContext();
  const reRender = state.reRenderMyTasks;
console.log(reRender);
  const { loading , data, refetch } = useQuery(QUERY_ME_TASKS,{variables:{reRender}});
  let tasks;

  if(reRender)
    {
      refetch();
      dispatch({ type: UPDATE_RERENDER_MYTASKS, payload: false});
    }

  let TableHeaderArr = [
    "name",
    "description",
    "priority",
    "dueDate",
    "duration",
    "status",
  ];
  if (!loading) {
    console.log(data.me)
    tasks = data.me.myTasks;
    console.log(tasks)
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
