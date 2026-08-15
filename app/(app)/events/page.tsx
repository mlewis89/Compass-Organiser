"use client";

import { Grid, GridColumn, GridRow } from "semantic-ui-react";
import EventList from "@/components/EventList";
import DetailedEventItem from "@/components/DetailedEventItem";
import RequireGroupModule from "@/components/RequireGroupModule";

export default function EventsPage() {
  return (
    <RequireGroupModule module="events">
      <Grid stackable>
        <GridRow stretched>
          <GridColumn width={6}>
            <EventList />
          </GridColumn>
          <GridColumn width={10}>
            <DetailedEventItem />
          </GridColumn>
        </GridRow>
      </Grid>
    </RequireGroupModule>
  );
}
