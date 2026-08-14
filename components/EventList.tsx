"use client";

import { useQuery } from "@apollo/client";
import {
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
import PlaceholderEvent from "@/components/placeholder/PlaceholderEvent";

function formatEventDate(value?: string | null) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString();
}

export default function EventList() {
  const [state, dispatch] = useCompassContext();
  const { data } = useQuery<{ events: EventItem[] }>(QUERY_EVENTS);
  const events = data?.events;

  return (
    <Segment padded>
      <Label attached="top">Upcoming Events</Label>
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
                    <ItemExtra>{` ~ ${event.organisor?.displayName ?? ""}`}</ItemExtra>
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
  );
}
