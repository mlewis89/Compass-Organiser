"use client";

import { useQuery } from "@apollo/client";
import { useState } from "react";
import {
  Button,
  Item,
  ItemContent,
  ItemDescription,
  ItemExtra,
  ItemHeader,
  Label,
  Segment,
  Table,
  TableBody,
  TableRow,
} from "semantic-ui-react";
import { QUERY_EVENTS } from "@/lib/client/queries";
import { useCompassContext } from "@/lib/client/CompassContext";
import { UPDATE_ACTIVE_EVENT } from "@/lib/client/actions";
import type { EventItem } from "@/lib/client/types";
import { usePermissions } from "@/lib/client/usePermissions";
import PlaceholderEvent from "@/components/placeholder/PlaceholderEvent";
import EventFormModal from "@/components/EventFormModal";

function formatEventDate(value?: string | null) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString();
}

export default function EventList({ groupSlug }: { groupSlug?: string }) {
  const [state, dispatch] = useCompassContext();
  const { data, refetch } = useQuery<{ events: EventItem[] }>(QUERY_EVENTS, {
    variables: { groupSlug },
  });
  const { permissions } = usePermissions();
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const events = data?.events;

  return (
    <>
      <Segment padded>
        <Label attached="top">Upcoming Events</Label>
        {permissions.canManageEvents ? (
          <Button
            primary
            style={{ marginBottom: "1em" }}
            onClick={() => {
              setEditEventId(null);
              setShowFormModal(true);
            }}
          >
            New Event
          </Button>
        ) : null}
        {events ? (
          <Table selectable>
            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event._id}
                  data-key={event._id}
                  active={state.activeEventId === event._id}
                  onClick={() =>
                    dispatch({ type: UPDATE_ACTIVE_EVENT, payload: event._id })
                  }
                >
                  <Item>
                    <ItemContent>
                      <ItemHeader>
                        {formatEventDate(event.startDate)} {event.title}
                        {!event.isPublic ? " - PRIVATE EVENT" : ""}
                      </ItemHeader>
                      <ItemDescription>{event.description}</ItemDescription>
                      <ItemExtra>
                        {` ~ ${event.organisor?.displayName ?? ""}`}
                        {permissions.canManageEvents ? (
                          <Button
                            size="mini"
                            floated="right"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              setEditEventId(event._id);
                              setShowFormModal(true);
                            }}
                          >
                            Edit
                          </Button>
                        ) : null}
                      </ItemExtra>
                    </ItemContent>
                  </Item>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <PlaceholderEvent />
        )}
      </Segment>
      {showFormModal ? (
        <EventFormModal
          eventId={editEventId}
          open={showFormModal}
          groupSlug={groupSlug}
          onClose={() => setShowFormModal(false)}
          onSaved={() => {
            setShowFormModal(false);
            void refetch();
          }}
          onDeleted={() => void refetch()}
        />
      ) : null}
    </>
  );
}
