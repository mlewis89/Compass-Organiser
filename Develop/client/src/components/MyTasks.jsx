import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Segment,
  Label,
  Button,
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import { QUERY_ME_TASKS } from "../utils/queries";
import { useCompassContext } from "../utils/CompassContext";
import { UPDATE_RERENDER_MYTASKS } from "../utils/actions";
import TaskModal from'./TaskModal';
import { useState } from "react";

const MyTasks = () => {
  
  const [state, dispatch] = useCompassContext();
  const [activeTask, setActiveTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(null);
  const reRender = state.reRenderMyTasks;
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
    tasks = data.me.myTasks;
  }

  return (
    <>
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
                <TableCell>
                  <Button onClick={()=>{setShowTaskModal(true); setActiveTask(task._id)}}>Open Task</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        ) : (
          <></>
        )}
      </Table>
    </Segment>
    
    <TaskModal activeTask={activeTask} showTaskModal={showTaskModal} setShowTaskModal={setShowTaskModal}/>
    </>
    
  );
};

export default MyTasks;
