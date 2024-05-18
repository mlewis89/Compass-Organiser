import { useQuery, useMutation } from "@apollo/client";
import {
  Modal,
  Segment,
  Form,
  FormField,
  Button,
  Input,
  Select,
  Label,
  ModalHeader,
  ModalActions,
  ModalContent,
} from "semantic-ui-react";
import { QUERY_SINGLE_TASK } from "../utils/queries";
import {
  ADD_TASK,
  REMOVE_USER_TASK,
  DELETE_TASK,
  UPDATE_TASK,
} from "../utils/mutations";
import { useState } from "react";

const emptyUser = { displayName: "" };

function TaskModal({ activeTask, showTaskModal, setShowTaskModal }) {
  const [taskData, setTaskData] = useState({
    name: "",
    description: "",
    duration: 2,
    priority: 5,
    status: "toDo",
    dueDate: "",
    requiredSkills: [],
    resposible: { ...emptyUser },
    createdBy: { ...emptyUser },
  });

  const [deleteCheckOpen, setDeleteCheckOpen] = useState(false);

  const [FormErrors, setFormErrors] = useState({
    email: false,
    password: false,
  });

  /*
  const handleOnBlur = (event) => {
    const { name, value } = event.target;
    return validateInput({ name, value });
  };
  const validateInput = (name, value) => {
    var invalidData = false;
    switch (name) {
      case "ABC":
        if (!value) {
          setFormErrors({ ...FormErrors, [name]: true });
          console.log(name)

          invalidData = true;
        } else {
          setFormErrors({ ...FormErrors, [name]: false });
        }
        break;
      default:
        setFormErrors({ ...FormErrors, [name]: false });
        break;
    }
    return invalidData;
  };*/

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setTaskData({ ...taskData, [name]: value });
    //validateInput({ name, value });
  };

  const handleDropdownChange = (event, data) => {
    setTaskData({ ...taskData, [data.name]: data.value });
  };
  /*
  const validateForm = () => {
    var validData = true;
    for (let i in taskData) {
      if (!validateInput(i, taskData.i)) {
        validData = false;
      }
    }
    console.log(validData)
    return validData;
  };
*/

  const taskStatusOptions = [
    { text: "To Do", value: "toDo" },
    { text: "In Progress", value: "inProgress" },
    { text: "Complete", value: "complete" },
  ];

  const { loading, data } = useQuery(QUERY_SINGLE_TASK, {
    variables: { taskId: activeTask },
    onCompleted: () => {
      setTaskData(data.singleTask);
    },
  });

  const [removerUserFromTask, { removeError }] = useMutation(REMOVE_USER_TASK);

  const [addTask, { addError }] = useMutation(ADD_TASK);
  const [updateTask, { updateError }] = useMutation(UPDATE_TASK);
  const [deleteTask, { deleteError }] = useMutation(DELETE_TASK);

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (/*validateForm()*/ 1) {
      try {
        //update Task
        const { data } = await updateTask({
          variables: {
            taskId: taskData._id,
            taskData: {
              name: taskData.name,
              description: taskData.description,
              duration: parseFloat(taskData.duration),
              priority: parseInt(taskData.priority),
              status: taskData.status,
              //dueDate: taskData.dueDate,
              //requiredSkills: taskData.requiredSkills,
              //responsible: taskData.responsible,
            },
          },
        });

        console.log(data);

        if (updateError) {
          throw new Error("something went wrong!");
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  console.log(taskData);

  return (
    <Modal
      centered={false}
      onOpen={() => {}}
      open={showTaskModal}
      aria-labelledby="task-modal"
      size="large"
      dimmer="blurring"
    >
      <Segment>
        <Form onSubmit={handleFormSubmit}>
          {taskData ? (
            <>
              <FormField
                control={Input}
                value={taskData.name}
                label="Task Name"
                name="name"
                //onBlur={handleOnBlur}
                onChange={handleInputChange}
              />
              <FormField
                control={Input}
                value={taskData.description}
                label="Description"
                name="description"
                //onBlur={handleOnBlur}
                onChange={handleInputChange}
              />
              <FormField>
                <label>Priority</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  name="priority"
                  value={taskData.priority}
                  onChange={handleInputChange}
                />
                <Label circular size="big">
                  {taskData.priority}
                </Label>
              </FormField>
              <FormField>
                <label>Duration</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step=".5"
                  name="duration"
                  value={taskData.duration}
                  onChange={handleInputChange}
                />
                <Label circular size="big">
                  {taskData.duration} hrs
                </Label>
              </FormField>

              <FormField
                control={Input}
                value={taskData.dueDate}
                label="Due Date"
                name="dueDate"
                //onBlur={handleOnBlur}
                onChange={handleInputChange}
              />
              <FormField
                control={Select}
                placeholder={taskData.status}
                options={taskStatusOptions}
                label="Status"
                name="status"
                //onBlur={handleOnBlur}
                onChange={handleDropdownChange}
              ></FormField>
              <FormField
                control={Input}
                value={taskData.requiredSkills.map((skill) => skill.name)}
                label="Required Skills"
                name="requiredSkills"
                //onBlur={handleOnBlur}
                onChange={handleInputChange}
              />
              <FormField
                control={Input}
                value={taskData.resposible?.displayName}
                label="Person Responsible"
                name="resonsible"
                //onBlur={handleOnBlur}
                onChange={handleInputChange}
              />
              <p>created by: {taskData.createdBy.displayName}</p>
              <Button type="submit">Update</Button>

              <Modal
                onClose={() => setDeleteCheckOpen(false)}
                open={deleteCheckOpen}
                size="small"
              >
                <ModalHeader>Confirm Delete</ModalHeader>
                <ModalContent>
                  <p>
                    Are you sure you want to delete the {taskData.name} Task?
                  </p>
                </ModalContent>
                <ModalActions>
                  <Button
                    icon="check"
                    content="Yes"
                    onClick={() => {
                      {
                        deleteTask({ variables: { taskId: taskData._id } });
                        setDeleteCheckOpen(false);
                        setShowTaskModal(false);
                      }
                    }}
                  />
                  <Button
                    icon="check"
                    content="No"
                    onClick={() => {
                      setDeleteCheckOpen(false);
                    }}
                  />
                </ModalActions>
              </Modal>
            </>
          ) : (
            <p>Loading...</p>
          )}

          <>
            <Button
              onClick={() => {
                removerUserFromTask({ variables: { taskId: taskData._id } });
                setShowTaskModal(false);
              }}
            >
              Remove from my Tasks
            </Button>
            <Button onClick={() => setDeleteCheckOpen(true)}>
              delete Task?
            </Button>
          </>

          <Button onClick={() => setShowTaskModal(false)}>Close</Button>
        </Form>
      </Segment>
    </Modal>
  );
}

export default TaskModal;
