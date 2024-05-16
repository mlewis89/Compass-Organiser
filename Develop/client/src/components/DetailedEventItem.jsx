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
  import { QUERY_SINGLE_EVENT } from "../utils/queries";
  import PlaceholderEvent from "./placeholder/placeholder-event";
  
  const DetailedEventItem = ({_id}) => {
    const { data } = useQuery(QUERY_SINGLE_EVENT, {
        variables: { _id },
      });
    let event;
  
    if (data) {
      console.log(data);
      event = data.event;
      }
  
    return (
      <Segment padded>
            <Label attached="top">Event Details</Label>
            
      <Grid columns={1} stackable>
        {event ? (
          <>
            
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
  
  export default DetailedEventItem;
  