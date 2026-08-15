"use client";

import { Grid, GridColumn, GridRow, Header, Segment } from "semantic-ui-react";
import BoardPostList from "@/components/BoardPostList";
import EventList from "@/components/EventList";
import DetailedEventItem from "@/components/DetailedEventItem";
import type { EnabledModules } from "@/lib/client/types";

type Props = {
  groupName: string;
  groupSlug: string;
  enabledModules: EnabledModules;
};

export default function GroupPublicView({
  groupName,
  groupSlug,
  enabledModules,
}: Props) {
  const showNoticeBoard = enabledModules.noticeBoard;
  const showEvents = enabledModules.events;

  return (
    <>
      <Segment padded>
        <Header as="h1">
          {groupName}
          <Header.Subheader>
            {showNoticeBoard || showEvents
              ? "Public notices and events for this group. Members can log in for the full dashboard."
              : "Public information for this group. Members can log in for the full dashboard."}
          </Header.Subheader>
        </Header>
      </Segment>
      {showNoticeBoard || showEvents ? (
        <Grid stackable>
          <GridRow stretched>
            {showNoticeBoard ? (
              <GridColumn width={showEvents ? 7 : 16}>
                <BoardPostList groupSlug={groupSlug} />
              </GridColumn>
            ) : null}
            {showEvents ? (
              <GridColumn width={showNoticeBoard ? 9 : 16}>
                <EventList groupSlug={groupSlug} />
                <DetailedEventItem groupSlug={groupSlug} />
              </GridColumn>
            ) : null}
          </GridRow>
        </Grid>
      ) : (
        <Segment padded>
          <p>No public modules are enabled for this group.</p>
        </Segment>
      )}
    </>
  );
}
