import {
  Segment,
  Label,
  GridRow,
  GridColumn,
  Grid,
  Button,
  Header,
  Icon,
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_EVENT } from "../utils/queries";
import PlaceholderEvent from "./placeholder/placeholder-event";
import { useCompassContext } from "../utils/CompassContext";

const DetailedEventItem = () => {
  //pull in context data
  const [state, dispatch] = useCompassContext();

  const { data } = useQuery(QUERY_SINGLE_EVENT, {
    variables: { eventId: state.activeEventId },
  });
  let event;

  if (data) {
    event = { ...data.singleEvent };
    console.log(event.startDate);
    //convert dates from epoch strings
    event.startDate = new Date(parseInt(event.startDate));
    event.endDate = new Date(parseInt(event.endDate));

    return (
      <Segment padded>
        <Label attached="top">Event Details</Label>

        {event ? (
          <>
            <Grid key={event._id} celled="internally" stackable>
              <GridRow>
                <GridColumn>
                  <Header>{event.title}</Header>

                  <p>Organisor: {event.organisor.displayName}</p>
                  <p>Status: {event.status}</p>

                  <p>Location: {event.location}</p>
                  <p>{event.description}</p>
                  <p>
                    Start:{" "}
                    {`${event.startDate.toLocaleDateString()} ${event.startDate.toLocaleTimeString()}`}
                  </p>
                  <p>
                    End:{" "}
                    {`${event.endDate.toLocaleDateString()} ${event.endDate.toLocaleTimeString()}`}
                  </p>
                  <p>Cost: {event.cost}</p>
                  <p>
                    Visiblity: {event.isPublic ? <>Public</> : <>Private</>}
                  </p>

                  <h4> Attending</h4>
                  {event.attending.map((usr) => (
                    <Button
                      icon
                      labelPosition="right"
                      key={usr._id}
                      data-key={usr._id}
                    >
                      {usr.displayName}
                    </Button>
                  ))}
                </GridColumn>
              </GridRow>

              <GridRow>
                <GridColumn width={14}>
                  <Header>Details</Header>
                  {event.plan}
                  {event.riskManagement}
                </GridColumn>
              </GridRow>
              <GridRow>
                <GridColumn width={8}>
                  <Segment placeholder>
                    <Header icon>
                      Event Planning Documents
                      <Icon name="pdf file outline" />
                      No documents are listed.
                    </Header>
                    <Button primary>Add Document</Button>
                  </Segment>
                </GridColumn>
                <GridColumn width={8}>
                  <Segment placeholder>
                    <Header icon>
                      Risk Assesmnent
                      <Icon name="pdf file outline" />
                      No documents are listed.
                    </Header>
                    <Button primary>Add Document</Button>
                  </Segment>
                </GridColumn>
              </GridRow>
            </Grid>
          </>
        ) : (
          <PlaceholderEvent />
        )}
      </Segment>
    );
  } else {
    return (
      <Segment padded>Select An event from the left to veiw details</Segment>
    );
  }
};

export default DetailedEventItem;
