"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dropdown,
  Form,
  FormField,
  Input,
  Label,
  Modal,
  Segment,
  Select,
} from "semantic-ui-react";
import { QUERY_MEMBERS, QUERY_SINGLE_TASK, QUERY_TASKS } from "@/lib/client/queries";
import {
  ADD_TASK,
  DELETE_TASK,
  REMOVE_USER_TASK,
  UPDATE_TASK,
} from "@/lib/client/mutations";
import type { Member, Skill, Task } from "@/lib/client/types";
import { usePermissions } from "@/lib/client/usePermissions";
import ConfirmDialog from "@/components/ConfirmDialog";
import SkillPicker from "@/components/SkillPicker";

function memberLabel(member: Pick<Member, "displayName" | "firstName" | "lastName" | "preferredName" | "scoutName">) {
  return (
    member.displayName?.trim() ||
    member.preferredName?.trim() ||
    member.scoutName?.trim() ||
    [member.firstName, member.lastName].filter(Boolean).join(" ").trim() ||
    "Unnamed member"
  );
}

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
  onSaved?: () => void;
};

export default function TaskModal({
  activeTask,
  showTaskModal,
  setShowTaskModal,
  onSaved,
}: Props) {
  const isCreateMode = !activeTask;
  const [taskData, setTaskData] = useState<Task>(emptyTask);
  const [deleteCheckOpen, setDeleteCheckOpen] = useState(false);
  const { permissions } = usePermissions();

  const { data } = useQuery<{ singleTask: Task }>(QUERY_SINGLE_TASK, {
    variables: { taskId: activeTask },
    skip: !activeTask,
  });
  const { data: membersData } = useQuery<{ members: Member[] }>(QUERY_MEMBERS, {
    skip: !showTaskModal,
  });

  useEffect(() => {
    if (isCreateMode) {
      setTaskData(emptyTask);
    } else if (data?.singleTask) {
      setTaskData(data.singleTask);
    }
  }, [data, isCreateMode]);

  const memberOptions = useMemo(() => {
    const members = membersData?.members ?? [];
    const options = members.map((member) => ({
      key: member._id,
      value: member._id,
      text: memberLabel(member),
    }));
    const responsibleId = taskData.responsible?._id;
    if (
      responsibleId &&
      !options.some((option) => option.value === responsibleId)
    ) {
      options.unshift({
        key: responsibleId,
        value: responsibleId,
        text: taskData.responsible?.displayName?.trim() || "Current responsible",
      });
    }
    return options;
  }, [membersData?.members, taskData.responsible]);

  const refetchQueries = [{ query: QUERY_TASKS }];

  const [removeUserFromTask] = useMutation(REMOVE_USER_TASK);
  const [addTask] = useMutation(ADD_TASK, { refetchQueries });
  const [updateTask] = useMutation(UPDATE_TASK, { refetchQueries });
  const [deleteTask] = useMutation(DELETE_TASK, { refetchQueries });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setTaskData({ ...taskData, [name]: value });
  };

  const canManage = Boolean(permissions.canManageTasks) || isCreateMode;

  const handleClose = () => setShowTaskModal(false);

  const handleSkillsChange = (skills: Skill[]) => {
    setTaskData({ ...taskData, requiredSkills: skills });
  };

  return (
    <Modal
      centered={false}
      open={showTaskModal}
      onClose={handleClose}
      aria-labelledby="task-modal"
      size="large"
      dimmer="blurring"
    >
      <Segment>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const variables = {
              name: taskData.name,
              description: taskData.description,
              duration: parseFloat(String(taskData.duration ?? 0)),
              priority: parseInt(String(taskData.priority ?? 0), 10),
              status: taskData.status,
              dueDate: taskData.dueDate || undefined,
              requiredSkills: (taskData.requiredSkills ?? []).map((skill) => ({
                _id: skill._id || undefined,
                name: skill.name,
                parentId: skill.parentId || undefined,
              })),
              responsible: taskData.responsible?._id
                ? { _id: taskData.responsible._id }
                : null,
            };
            if (isCreateMode) {
              void addTask({ variables: { taskData: variables } }).then(() => {
                setShowTaskModal(false);
                onSaved?.();
              });
            } else {
              void updateTask({
                variables: { taskId: taskData._id, taskData: variables },
              }).then(() => onSaved?.());
            }
          }}
        >
          <FormField
            control={Input}
            value={taskData.name ?? ""}
            label="Task Name"
            name="name"
            onChange={handleInputChange}
            disabled={!canManage}
          />
          <FormField
            control={Input}
            value={taskData.description ?? ""}
            label="Description"
            name="description"
            onChange={handleInputChange}
            disabled={!canManage}
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
              disabled={!canManage}
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
              disabled={!canManage}
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
            disabled={!canManage}
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
          <FormField>
            <label>Required Skills</label>
            <SkillPicker
              mode="task"
              selectedIds={(taskData.requiredSkills ?? []).map((s) => s._id)}
              onChange={handleSkillsChange}
              disabled={!canManage}
              allowCreate={canManage}
            />
          </FormField>
          <FormField>
            <label>Person Responsible</label>
            <Dropdown
              placeholder="Search members…"
              fluid
              search
              selection
              clearable
              options={memberOptions}
              value={taskData.responsible?._id || undefined}
              disabled={!canManage}
              onChange={(_event, dropdownData) => {
                const memberId = String(dropdownData.value ?? "");
                if (!memberId) {
                  setTaskData({
                    ...taskData,
                    responsible: { _id: "", displayName: "" },
                  });
                  return;
                }
                const selected = memberOptions.find(
                  (option) => option.value === memberId,
                );
                setTaskData({
                  ...taskData,
                  responsible: {
                    _id: memberId,
                    displayName: selected?.text ?? "",
                  },
                });
              }}
            />
          </FormField>
          {!isCreateMode ? <p>created by: {taskData.createdBy?.displayName}</p> : null}
          <Button type="submit">{isCreateMode ? "Create" : "Update"}</Button>
          {!isCreateMode ? (
            <Button
              type="button"
              onClick={() => {
                void removeUserFromTask({ variables: { taskId: taskData._id } }).then(() =>
                  onSaved?.(),
                );
                setShowTaskModal(false);
              }}
            >
              Remove from my Tasks
            </Button>
          ) : null}
          {!isCreateMode && canManage ? (
            <Button type="button" onClick={() => setDeleteCheckOpen(true)}>
              Delete Task?
            </Button>
          ) : null}
          <Button type="button" onClick={handleClose}>
            Close
          </Button>
        </Form>
      </Segment>
      <ConfirmDialog
        open={deleteCheckOpen}
        header="Confirm Delete"
        message={`Are you sure you want to delete the ${taskData.name} task?`}
        onCancel={() => setDeleteCheckOpen(false)}
        onConfirm={() => {
          void deleteTask({ variables: { taskId: taskData._id } }).then(() => onSaved?.());
          setDeleteCheckOpen(false);
          setShowTaskModal(false);
        }}
      />
    </Modal>
  );
}
