"use client";

import { Grid, GridColumn, GridRow, Header, Segment } from "semantic-ui-react";
import BoardPostList from "@/components/BoardPostList";
import EventList from "@/components/EventList";
import DetailedEventItem from "@/components/DetailedEventItem";

type Props = {
  groupName: string;
  groupSlug: string;
};

export default function GroupPublicView({ groupName, groupSlug }: Props) {
  return (
    <>
      <Segment padded>
        <Header as="h1">
          {groupName}
          <Header.Subheader>
            Public notices and events for this group. Members can log in for
            the full dashboard.
          </Header.Subheader>
        </Header>
      </Segment>
      <Grid stackable>
        <GridRow stretched>
          <GridColumn width={7}>
            <BoardPostList groupSlug={groupSlug} />
          </GridColumn>
          <GridColumn width={9}>
            <EventList groupSlug={groupSlug} />
            <DetailedEventItem groupSlug={groupSlug} />
          </GridColumn>
        </GridRow>
      </Grid>
    </>
  );
}
