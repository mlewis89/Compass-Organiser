"use client";

import { Grid, GridColumn, GridRow } from "semantic-ui-react";
import EventList from "@/components/EventList";
import DetailedEventItem from "@/components/DetailedEventItem";

export default function EventsPage() {
  return (
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
  );
}
