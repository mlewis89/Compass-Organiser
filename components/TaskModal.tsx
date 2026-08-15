"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  FormField,
  Input,
  Label,
  Modal,
  Segment,
  Select,
} from "semantic-ui-react";
import { QUERY_ME_TASKS, QUERY_MEMBERS, QUERY_SINGLE_TASK, QUERY_TASKS, QUERY_UNIT_BUCKETS, QUERY_UNITS, QUERY_UNASSIGNED_TASKS } from "@/lib/client/queries";
import {
  ADD_TASK,
  DELETE_TASK,
  REMOVE_USER_TASK,
  UPDATE_TASK,
} from "@/lib/client/mutations";
import type { Member, Skill, Task, UnitSummary } from "@/lib/client/types";
import { TASK_STATUS_OPTIONS } from "@/lib/taskStatus";
import { usePermissions } from "@/lib/client/usePermissions";
import ConfirmDialog from "@/components/ConfirmDialog";
import PeopleUnitsSelect from "@/components/PeopleUnitsSelect";
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
  responsible: [],
  units: [],
  createdBy: { _id: "", displayName: "" },
  parentTaskId: null,
  parent: null,
  descendantCount: 0,
};

type Props = {
  activeTask: string | null;
  parentTask?: Task | null;
  showTaskModal: boolean;
  setShowTaskModal: (open: boolean) => void;
  onSaved?: () => void;
  onCreateSubtask?: (parent: Task) => void;
};

export default function TaskModal({
  activeTask,
  parentTask = null,
  showTaskModal,
  setShowTaskModal,
  onSaved,
  onCreateSubtask,
}: Props) {
  const isCreateMode = !activeTask;
  const isSubtaskCreate = isCreateMode && Boolean(parentTask);
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
  const { data: unitsData } = useQuery<{ units: UnitSummary[] }>(QUERY_UNITS, {
    skip: !showTaskModal,
  });

  useEffect(() => {
    if (isCreateMode) {
      setTaskData({
        ...emptyTask,
        parentTaskId: parentTask?._id ?? null,
        parent: parentTask
          ? { _id: parentTask._id, name: parentTask.name }
          : null,
        units: parentTask?.units ?? [],
      });
    } else if (data?.singleTask) {
      setTaskData(data.singleTask);
    }
  }, [data, isCreateMode, parentTask]);

  const memberOptions = useMemo(() => {
    const members = membersData?.members ?? [];
    const options = members.map((member) => ({
      key: member._id,
      value: member._id,
      text: memberLabel(member),
    }));
    for (const person of taskData.responsible ?? []) {
      if (person._id && !options.some((option) => option.value === person._id)) {
        options.unshift({
          key: person._id,
          value: person._id,
          text: person.displayName?.trim() || "Current responsible",
        });
      }
    }
    return options;
  }, [membersData?.members, taskData.responsible]);

  const unitOptions = useMemo(() => {
    const list = unitsData?.units ?? [];
    const options = list.map((unit) => ({
      key: unit._id,
      value: unit._id,
      text: unit.name,
    }));
    for (const unit of taskData.units ?? []) {
      if (unit._id && !options.some((option) => option.value === unit._id)) {
        options.unshift({
          key: unit._id,
          value: unit._id,
          text: unit.name || "Current unit",
        });
      }
    }
    return options;
  }, [unitsData?.units, taskData.units]);

  const refetchQueries = [
    { query: QUERY_TASKS },
    { query: QUERY_UNIT_BUCKETS },
    { query: QUERY_UNASSIGNED_TASKS },
    { query: QUERY_ME_TASKS },
  ];

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
              responsible: (taskData.responsible ?? [])
                .filter((person) => person._id)
                .map((person) => ({ _id: person._id })),
              units: (taskData.units ?? [])
                .filter((unit) => unit._id)
                .map((unit) => ({ _id: unit._id })),
              ...(isCreateMode && taskData.parentTaskId
                ? { parentTaskId: taskData.parentTaskId }
                : {}),
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
            label={isSubtaskCreate ? "Subtask Name" : "Task Name"}
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
            value={taskData.status ?? "toDo"}
            options={TASK_STATUS_OPTIONS}
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
            <label>People and units</label>
            <PeopleUnitsSelect
              placeholder="Search members or units…"
              memberOptions={memberOptions}
              unitOptions={unitOptions}
              personIds={(taskData.responsible ?? [])
                .map((person) => person._id)
                .filter(Boolean)}
              unitIds={(taskData.units ?? [])
                .map((unit) => unit._id)
                .filter((id): id is string => Boolean(id))}
              disabled={!canManage}
              onChange={({ personIds, unitIds }) => {
                setTaskData({
                  ...taskData,
                  responsible: personIds.map((memberId) => {
                    const selected = memberOptions.find(
                      (option) => option.value === memberId,
                    );
                    const existing = (taskData.responsible ?? []).find(
                      (person) => person._id === memberId,
                    );
                    return {
                      _id: memberId,
                      displayName:
                        selected?.text ?? existing?.displayName ?? "",
                    };
                  }),
                  units: unitIds.map((unitId) => {
                    const selected = unitOptions.find(
                      (option) => option.value === unitId,
                    );
                    const existing = (taskData.units ?? []).find(
                      (unit) => unit._id === unitId,
                    );
                    return {
                      _id: unitId,
                      name: selected?.text ?? existing?.name ?? "",
                    };
                  }),
                });
              }}
            />
          </FormField>
          {!isCreateMode ? <p>created by: {taskData.createdBy?.displayName}</p> : null}
          {taskData.parent?.name || isSubtaskCreate ? (
            <p>
              Nested under:{" "}
              {taskData.parent?.name || parentTask?.name || "parent task"}
            </p>
          ) : null}
          <Button type="submit">{isCreateMode ? "Create" : "Update"}</Button>
          {!isCreateMode && canManage && onCreateSubtask ? (
            <Button
              type="button"
              onClick={() => onCreateSubtask(taskData)}
            >
              Add subtask
            </Button>
          ) : null}
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
        message={
          (taskData.descendantCount ?? 0) > 0
            ? `Are you sure you want to delete "${taskData.name}" and its ${taskData.descendantCount} nested task${taskData.descendantCount === 1 ? "" : "s"}?`
            : `Are you sure you want to delete the ${taskData.name} task?`
        }
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
