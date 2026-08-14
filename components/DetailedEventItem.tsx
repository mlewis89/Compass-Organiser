"use client";

import { useQuery } from "@apollo/client";
import {
  Button,
  Grid,
  GridColumn,
  GridRow,
  Header,
  Icon,
  Label,
  Segment,
} from "semantic-ui-react";
import { QUERY_SINGLE_EVENT } from "@/lib/client/queries";
import { useCompassContext } from "@/lib/client/CompassContext";
import type { EventItem } from "@/lib/client/types";
import PlaceholderEvent from "@/components/placeholder/PlaceholderEvent";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return `${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString()}`;
}

export default function DetailedEventItem({ groupSlug }: { groupSlug?: string }) {
  const [state] = useCompassContext();
  const { data, loading } = useQuery<{ singleEvent: EventItem }>(
    QUERY_SINGLE_EVENT,
    {
      variables: { eventId: state.activeEventId, groupSlug },
      skip: !state.activeEventId,
    },
  );

  if (!state.activeEventId) {
    return (
      <Segment padded>Select an event from the left to view details</Segment>
    );
  }

  const event = data?.singleEvent;
  if (loading || !event) {
    return (
      <Segment padded>
        <PlaceholderEvent />
      </Segment>
    );
  }

  return (
    <Segment padded>
      <Label attached="top">Event Details</Label>
      <Grid key={event._id} celled="internally" stackable>
        <GridRow>
          <GridColumn>
            <Header>{event.title}</Header>
            <p>Organisor: {event.organisor?.displayName}</p>
            <p>Status: {event.status}</p>
            <p>Location: {event.location}</p>
            <p>{event.description}</p>
            <p>Start: {formatDateTime(event.startDate)}</p>
            <p>End: {formatDateTime(event.endDate)}</p>
            <p>Cost: {event.cost}</p>
            <p>Visibility: {event.isPublic ? "Public" : "Private"}</p>
            <h4>Attending</h4>
            {(event.attending ?? []).map((usr) => (
              <Button icon labelPosition="right" key={usr._id}>
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
                <Icon name="file pdf outline" />
                No documents are listed.
              </Header>
              <Button primary>Add Document</Button>
            </Segment>
          </GridColumn>
          <GridColumn width={8}>
            <Segment placeholder>
              <Header icon>
                Risk Assessment
                <Icon name="file pdf outline" />
                No documents are listed.
              </Header>
              <Button primary>Add Document</Button>
            </Segment>
          </GridColumn>
        </GridRow>
      </Grid>
    </Segment>
  );
}
