"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  FormField,
  Input,
  Modal,
  Segment,
  TextArea,
} from "semantic-ui-react";
import { QUERY_EVENTS, QUERY_SINGLE_EVENT } from "@/lib/client/queries";
import { ADD_EVENT, DELETE_EVENT, UPDATE_EVENT } from "@/lib/client/mutations";
import type { EventItem } from "@/lib/client/types";
import ConfirmDialog from "@/components/ConfirmDialog";

const emptyEvent: EventItem = {
  _id: "",
  title: "",
  startDate: "",
  endDate: "",
  isPublic: false,
  description: "",
  location: "",
  status: "planned",
  cost: 0,
  plan: "",
  riskManagement: "",
};

type Props = {
  eventId: string | null;
  open: boolean;
  groupSlug?: string;
  onClose: () => void;
  onSaved?: (eventId: string) => void;
  onDeleted?: () => void;
};

export default function EventFormModal({
  eventId,
  open,
  groupSlug,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const isCreateMode = !eventId;
  const [eventData, setEventData] = useState<EventItem>(emptyEvent);
  const [deleteCheckOpen, setDeleteCheckOpen] = useState(false);

  const { data } = useQuery<{ singleEvent: EventItem }>(QUERY_SINGLE_EVENT, {
    variables: { eventId, groupSlug },
    skip: !eventId,
  });

  useEffect(() => {
    if (isCreateMode) {
      setEventData(emptyEvent);
    } else if (data?.singleEvent) {
      setEventData(data.singleEvent);
    }
  }, [data, isCreateMode]);

  const refetchQueries = [{ query: QUERY_EVENTS, variables: { groupSlug } }];
  const [addEvent] = useMutation(ADD_EVENT, { refetchQueries });
  const [updateEvent] = useMutation(UPDATE_EVENT, { refetchQueries });
  const [deleteEvent] = useMutation(DELETE_EVENT, { refetchQueries });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setEventData({ ...eventData, [name]: value });
  };

  return (
    <Modal open={open} onClose={onClose} size="large" dimmer="blurring">
      <Segment>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const variables = {
              title: eventData.title,
              startDate: eventData.startDate || undefined,
              endDate: eventData.endDate || undefined,
              isPublic: Boolean(eventData.isPublic),
              description: eventData.description,
              location: eventData.location,
              plan: eventData.plan,
              riskManagement: eventData.riskManagement,
              status: eventData.status,
              cost: eventData.cost ? parseFloat(String(eventData.cost)) : undefined,
            };
            if (isCreateMode) {
              void addEvent({ variables: { eventData: variables } }).then((result) => {
                const created = result.data?.addEvent as EventItem | undefined;
                onClose();
                if (created?._id) {
                  onSaved?.(created._id);
                }
              });
            } else {
              void updateEvent({
                variables: { eventId: eventData._id, eventData: variables },
              }).then(() => onSaved?.(eventData._id));
            }
          }}
        >
          <FormField
            control={Input}
            value={eventData.title ?? ""}
            label="Title"
            name="title"
            onChange={handleChange}
            required
          />
          <FormField
            control={Input}
            type="datetime-local"
            value={eventData.startDate ? eventData.startDate.slice(0, 16) : ""}
            label="Start"
            name="startDate"
            onChange={handleChange}
          />
          <FormField
            control={Input}
            type="datetime-local"
            value={eventData.endDate ? eventData.endDate.slice(0, 16) : ""}
            label="End"
            name="endDate"
            onChange={handleChange}
          />
          <FormField
            control={Input}
            value={eventData.location ?? ""}
            label="Location"
            name="location"
            onChange={handleChange}
          />
          <FormField
            control={TextArea}
            value={eventData.description ?? ""}
            label="Description"
            name="description"
            onChange={handleChange}
          />
          <FormField
            control={TextArea}
            value={eventData.plan ?? ""}
            label="Plan"
            name="plan"
            onChange={handleChange}
          />
          <FormField
            control={TextArea}
            value={eventData.riskManagement ?? ""}
            label="Risk Management"
            name="riskManagement"
            onChange={handleChange}
          />
          <FormField
            control={Input}
            type="number"
            value={eventData.cost ?? 0}
            label="Cost"
            name="cost"
            onChange={handleChange}
          />
          <FormField
            control={Input}
            value={eventData.status ?? ""}
            label="Status"
            name="status"
            onChange={handleChange}
          />
          <FormField>
            <Checkbox
              label="Public event"
              checked={Boolean(eventData.isPublic)}
              onChange={(_event, checkboxData) =>
                setEventData({ ...eventData, isPublic: Boolean(checkboxData.checked) })
              }
            />
          </FormField>
          <Button type="submit" primary>
            {isCreateMode ? "Create Event" : "Save Changes"}
          </Button>
          {!isCreateMode ? (
            <Button type="button" negative onClick={() => setDeleteCheckOpen(true)}>
              Delete Event
            </Button>
          ) : null}
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </Form>
      </Segment>
      <ConfirmDialog
        open={deleteCheckOpen}
        header="Confirm Delete"
        message={`Are you sure you want to delete "${eventData.title}"?`}
        onCancel={() => setDeleteCheckOpen(false)}
        onConfirm={() => {
          void deleteEvent({ variables: { eventId: eventData._id } }).then(() => {
            setDeleteCheckOpen(false);
            onClose();
            onDeleted?.();
          });
        }}
      />
    </Modal>
  );
}
