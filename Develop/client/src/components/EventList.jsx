import {
  Item,
  ItemExtra,
  ItemDescription,
  ItemContent,
  ItemImage,
  ItemHeader,
  Segment,
  Label,
  TableRow,
  TableBody,
  Table,
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import { QUERY_EVENTS } from "../utils/queries";
import PlaceholderEvent from "./placeholder/placeholder-event";

import { useCompassContext } from "../utils/CompassContext";
import { UPDATE_ACTIVE_EVENT } from "../utils/actions";

const EventList = () => {
  const [state, dispatch] = useCompassContext();

  const { data } = useQuery(QUERY_EVENTS);
  let events;

  const handleSelectRow = (event) => {
    let _id = event.currentTarget.getAttribute("data-key");
    dispatch({ type: UPDATE_ACTIVE_EVENT, payload: _id });
  };

  if (data) {
    events = data.events;
  }

  return (
    <Segment padded>
      <Label attached="top">Upcoming Events</Label>

      {events ? (
        <Table selectable>
          <TableBody>
            {events.map((event) => (
              <TableRow
                onClick={handleSelectRow}
                data-key={event._id}
                key={event._id}
                active={state.activeEventId == event._id}
              >
                <Item key={event._id}>
                  <ItemImage size="tiny" src={event.image} />
                  <ItemContent>
                    <ItemHeader>
                      {new Date(parseInt(event.startDate)).toLocaleDateString()}{" "}
                      {event.title}
                      {!event.isPublic ? (<> - PRIVATE EVENT</>) :(<></>)}
                    </ItemHeader>
                    <ItemDescription>{event.description}</ItemDescription>
                    <ItemExtra>
                      {` ~ ${event.organisor.displayName}`}
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
  );
};

export default EventList;
