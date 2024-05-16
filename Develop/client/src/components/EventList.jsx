import {
  GridColumn,
  Grid,
  Item,
  ItemExtra,
  ItemDescription,
  ItemContent,
  ItemImage,
  ItemHeader,
  Segment,
  Label
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import { QUERY_EVENTS } from "../utils/queries";
import PlaceholderEvent from "./placeholder/placeholder-event";

const EventList = ({setCurrentEventId}) => {
  const { data } = useQuery(QUERY_EVENTS);
  let events;

  if (data) {
    events = data.events;
  }

  setCurrentEventId("664543dc5bbfb57230c84c17")

  return (
    <Segment padded>
            <Label attached="top">Upcoming Events</Label>


    <Grid columns={1} stackable>
      {events ? (
        <>
          {events.map((event) => (
            <GridColumn key={event._id}>
              <Item key={event._id}>
                <ItemImage size="tiny" src={event.image} />
                <ItemContent>
                <ItemHeader as="a">{new Date(parseInt(event.startDate)).toLocaleDateString()} {event.title}</ItemHeader>
                  <ItemDescription>{event.description}</ItemDescription>
                  <ItemExtra>
                    {` ~ ${
                      event.organisor.scoutName ||
                      event.organisor.preferredName ||
                      event.organisor.firstName
                    }`}
                  </ItemExtra>
                </ItemContent>
              </Item>
            </GridColumn>
          ))}
        </>
      ) : (
        <GridColumn>
          <PlaceholderEvent />
        </GridColumn>
      )}
    </Grid>
    </Segment>
  );
};

export default EventList;
