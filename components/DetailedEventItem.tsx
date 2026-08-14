"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
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
import { QUERY_ME_TIME, QUERY_SINGLE_EVENT } from "@/lib/client/queries";
import { JOIN_EVENT, LEAVE_EVENT, SET_EVENT_ATTENDEE } from "@/lib/client/mutations";
import { useCompassContext } from "@/lib/client/CompassContext";
import type { EventItem } from "@/lib/client/types";
import { usePermissions } from "@/lib/client/usePermissions";
import PlaceholderEvent from "@/components/placeholder/PlaceholderEvent";
import EventFormModal from "@/components/EventFormModal";

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
  const { permissions } = usePermissions();
  const { data: meData } = useQuery<{ me: { _id: string } }>(QUERY_ME_TIME);
  const [showFormModal, setShowFormModal] = useState(false);
  const { data, loading, refetch } = useQuery<{ singleEvent: EventItem }>(
    QUERY_SINGLE_EVENT,
    {
      variables: { eventId: state.activeEventId, groupSlug },
      skip: !state.activeEventId,
    },
  );

  const refetchQueries = [
    {
      query: QUERY_SINGLE_EVENT,
      variables: { eventId: state.activeEventId, groupSlug },
    },
  ];
  const [joinEvent] = useMutation(JOIN_EVENT, { refetchQueries });
  const [leaveEvent] = useMutation(LEAVE_EVENT, { refetchQueries });
  const [setEventAttendee] = useMutation(SET_EVENT_ATTENDEE, { refetchQueries });

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

  const currentUserId = meData?.me?._id;
  const isAttending = (event.attending ?? []).some(
    (attendee) => attendee._id === currentUserId,
  );

  return (
    <>
      <Segment padded>
        <Label attached="top">Event Details</Label>
        <Grid key={event._id} celled="internally" stackable>
          <GridRow>
            <GridColumn>
              <Header>
                {event.title}
                {permissions.canManageEvents ? (
                  <Button
                    size="mini"
                    floated="right"
                    onClick={() => setShowFormModal(true)}
                  >
                    Edit / Delete
                  </Button>
                ) : null}
              </Header>
              <p>Organisor: {event.organisor?.displayName}</p>
              <p>Status: {event.status}</p>
              <p>Location: {event.location}</p>
              <p>{event.description}</p>
              <p>Start: {formatDateTime(event.startDate)}</p>
              <p>End: {formatDateTime(event.endDate)}</p>
              <p>Cost: {event.cost}</p>
              <p>Visibility: {event.isPublic ? "Public" : "Private"}</p>
              {currentUserId ? (
                <Button
                  primary={!isAttending}
                  onClick={() =>
                    void (isAttending
                      ? leaveEvent({ variables: { eventId: event._id } })
                      : joinEvent({ variables: { eventId: event._id } }))
                  }
                >
                  {isAttending ? "Cancel RSVP" : "RSVP - I'm attending"}
                </Button>
              ) : null}
              <h4>Attending</h4>
              {(event.attending ?? []).map((usr) => (
                <Button icon labelPosition="right" key={usr._id}>
                  {usr.displayName}
                  {permissions.canManageEvents ? (
                    <Icon
                      name="delete"
                      onClick={() =>
                        void setEventAttendee({
                          variables: {
                            eventId: event._id,
                            userId: usr._id,
                            attending: false,
                          },
                        })
                      }
                    />
                  ) : null}
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
              </Segment>
            </GridColumn>
            <GridColumn width={8}>
              <Segment placeholder>
                <Header icon>
                  Risk Assessment
                  <Icon name="file pdf outline" />
                  No documents are listed.
                </Header>
              </Segment>
            </GridColumn>
          </GridRow>
        </Grid>
      </Segment>
      {showFormModal ? (
        <EventFormModal
          eventId={event._id}
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
