"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  Button,
  Form,
  FormField,
  Input,
  Label,
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  Segment,
  Select,
} from "semantic-ui-react";
import { QUERY_SINGLE_TASK } from "@/lib/client/queries";
import { DELETE_TASK, REMOVE_USER_TASK, UPDATE_TASK } from "@/lib/client/mutations";
import type { Task } from "@/lib/client/types";

const emptyTask: Task = {
  _id: "",
  name: "",
  description: "",
  duration: 2,
  priority: 5,
  status: "toDo",
  dueDate: "",
  requiredSkills: [],
  responsible: { _id: "", displayName: "" },
  createdBy: { _id: "", displayName: "" },
};

const taskStatusOptions = [
  { text: "To Do", value: "toDo" },
  { text: "In Progress", value: "inProgress" },
  { text: "Complete", value: "complete" },
];

type Props = {
  activeTask: string | null;
  showTaskModal: boolean;
  setShowTaskModal: (open: boolean) => void;
};

export default function TaskModal({
  activeTask,
  showTaskModal,
  setShowTaskModal,
}: Props) {
  const [taskData, setTaskData] = useState<Task>(emptyTask);
  const [deleteCheckOpen, setDeleteCheckOpen] = useState(false);

  const { data } = useQuery<{ singleTask: Task }>(QUERY_SINGLE_TASK, {
    variables: { taskId: activeTask },
    skip: !activeTask,
  });

  useEffect(() => {
    if (data?.singleTask) {
      setTaskData(data.singleTask);
    }
  }, [data]);

  const [removeUserFromTask] = useMutation(REMOVE_USER_TASK);
  const [updateTask] = useMutation(UPDATE_TASK);
  const [deleteTask] = useMutation(DELETE_TASK);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setTaskData({ ...taskData, [name]: value });
  };

  return (
    <Modal
      centered={false}
      open={showTaskModal}
      aria-labelledby="task-modal"
      size="large"
      dimmer="blurring"
    >
      <Segment>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void updateTask({
              variables: {
                taskId: taskData._id,
                taskData: {
                  name: taskData.name,
                  description: taskData.description,
                  duration: parseFloat(String(taskData.duration ?? 0)),
                  priority: parseInt(String(taskData.priority ?? 0), 10),
                  status: taskData.status,
                },
              },
            });
          }}
        >
          <FormField
            control={Input}
            value={taskData.name ?? ""}
            label="Task Name"
            name="name"
            onChange={handleInputChange}
          />
          <FormField
            control={Input}
            value={taskData.description ?? ""}
            label="Description"
            name="description"
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
              value={taskData.priority ?? 0}
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
              step="0.5"
              name="duration"
              value={taskData.duration ?? 0}
              onChange={handleInputChange}
            />
            <Label circular size="big">
              {taskData.duration} hrs
            </Label>
          </FormField>
          <FormField
            control={Input}
            value={taskData.dueDate ?? ""}
            label="Due Date"
            name="dueDate"
            onChange={handleInputChange}
          />
          <FormField
            control={Select}
            placeholder={taskData.status ?? "toDo"}
            options={taskStatusOptions}
            label="Status"
            name="status"
            onChange={(
              _event: unknown,
              selectData: { name?: string; value?: string | number },
            ) => {
              setTaskData({ ...taskData, status: String(selectData.value ?? "") });
            }}
          />
          <FormField
            control={Input}
            value={(taskData.requiredSkills ?? []).map((skill) => skill.name).join(", ")}
            label="Required Skills"
            name="requiredSkills"
            readOnly
          />
          <FormField
            control={Input}
            value={taskData.responsible?.displayName ?? ""}
            label="Person Responsible"
            name="responsible"
            readOnly
          />
          <p>created by: {taskData.createdBy?.displayName}</p>
          <Button type="submit">Update</Button>
          <Button
            type="button"
            onClick={() => {
              void removeUserFromTask({ variables: { taskId: taskData._id } });
              setShowTaskModal(false);
            }}
          >
            Remove from my Tasks
          </Button>
          <Button type="button" onClick={() => setDeleteCheckOpen(true)}>
            Delete Task?
          </Button>
          <Button type="button" onClick={() => setShowTaskModal(false)}>
            Close
          </Button>
        </Form>
      </Segment>
      <Modal
        onClose={() => setDeleteCheckOpen(false)}
        open={deleteCheckOpen}
        size="small"
      >
        <ModalHeader>Confirm Delete</ModalHeader>
        <ModalContent>
          <p>Are you sure you want to delete the {taskData.name} Task?</p>
        </ModalContent>
        <ModalActions>
          <Button
            icon="check"
            content="Yes"
            onClick={() => {
              void deleteTask({ variables: { taskId: taskData._id } });
              setDeleteCheckOpen(false);
              setShowTaskModal(false);
            }}
          />
          <Button
            content="No"
            onClick={() => setDeleteCheckOpen(false)}
          />
        </ModalActions>
      </Modal>
    </Modal>
  );
}
