"use client";

import { Grid, GridColumn, GridRow } from "semantic-ui-react";
import BoardPostList from "@/components/BoardPostList";
import EventList from "@/components/EventList";

export default function HomePage() {
  return (
    <Grid columns={2}>
      <GridRow stretched>
        <GridColumn>
          <BoardPostList />
        </GridColumn>
        <GridColumn>
          <EventList />
        </GridColumn>
      </GridRow>
    </Grid>
  );
}
