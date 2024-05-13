import {
  GridColumn,
  Grid,
  Item,
  ItemExtra,
  ItemDescription,
  ItemContent,
  ItemImage,
  ItemHeader,
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import { QUERY_EVENTS } from "../utils/queries";
import PlaceholderEvent from "./placeholder/placeholder-event";

const EventList = () => {
  const { data } = useQuery(QUERY_EVENTS);
  let events;

  if (data) {
    console.log(data);
    events = data.events;
    console.log(events);
  }

  return (
    <Grid columns={1} stackable>
      {events ? (
        <>
          {events.map((event) => (
            <GridColumn key={event._id}>
              <Item key={event._id}>
                <ItemImage size="tiny" src={event.image} />
                <ItemContent>
                  <ItemHeader as="a">{event.title}</ItemHeader>
                  <ItemDescription>{event.content}</ItemDescription>
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
  );
};

export default EventList;
