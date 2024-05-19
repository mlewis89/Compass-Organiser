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
import { ASSIGN_USER_TASK } from "../utils/mutations";
import { useCompassContext } from "../utils/CompassContext";
import { UPDATE_RERENDER_MYTASKS, ASSIGN_USER_TO_TASK, REMOVE_SUGGESTED_TASK, ADD_TO_MY_TASK} from '../utils/actions'
import AuthService from "../utils/auth";

const SuggestedTasks = () => {
  const [state, dispatch] = useCompassContext();

  let mySkills = state.skills.filter((skill) => skill.isActiveForUser);
  let querySkills  = mySkills.map((s)=>{return {_id: s._id, name: s.name};})

  const { data } = useQuery(QUERY_SUGGESTED_TASKS, {
    variables: {numberOfTasks: state.TimeAvailable, userSkills: [...querySkills]}
  });
  const [assignUserTask, { error }] = useMutation(ASSIGN_USER_TASK);

  const handleAddTask = (event, data) => {
    let _id = data["data-key"];
    assignUserTask({ variables: { taskId: _id } });
    //trigger reRender of MyTASKS
    dispatch({ type: ASSIGN_USER_TO_TASK, payload: {taskId:_id, userData: AuthService.getProfile().data}});
    dispatch({ type: REMOVE_SUGGESTED_TASK, payload: _id});
    dispatch({ type: ADD_TO_MY_TASK, payload: _id});
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
  if (data && data.suggestedTasks) {
    tasks = [...data.suggestedTasks];
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
