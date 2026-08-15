"use client";

import { Grid, GridColumn, GridRow } from "semantic-ui-react";
import BoardPostList from "@/components/BoardPostList";
import EventList from "@/components/EventList";
import MyTasks from "@/components/MyTasks";
import MyStats from "@/components/MyStats";
import UnitBucketStats from "@/components/UnitBucketStats";
import { useGroupModules } from "@/lib/client/useGroupModules";

export default function DashboardPage() {
  const { enabledModules, loading } = useGroupModules();

  if (loading) {
    return <p>Loading…</p>;
  }

  const showNoticeBoard = enabledModules.noticeBoard;
  const showEvents = enabledModules.events;
  const showTasks = enabledModules.tasks;
  const showStats = enabledModules.memberStats;
  const showRightColumn = showEvents || showTasks;
  const showTopRow = showNoticeBoard || showRightColumn;

  if (!showTopRow && !showStats) {
    return (
      <p>
        No modules are enabled for this group yet. Group leaders can turn
        features on under Settings.
      </p>
    );
  }

  return (
    <Grid stackable doubling>
      {showTopRow ? (
        <GridRow stretched columns={showNoticeBoard && showRightColumn ? 2 : 1}>
          {showNoticeBoard ? (
            <GridColumn width={showRightColumn ? 7 : 16}>
              <BoardPostList />
            </GridColumn>
          ) : null}
          {showRightColumn ? (
            <GridColumn width={showNoticeBoard ? 9 : 16}>
              {showEvents ? <EventList /> : null}
              {showTasks ? <MyTasks /> : null}
              {showTasks ? <UnitBucketStats /> : null}
            </GridColumn>
          ) : null}
        </GridRow>
      ) : null}
      {showStats ? (
        <GridRow stretched columns={1}>
          <GridColumn>
            <MyStats />
          </GridColumn>
        </GridRow>
      ) : null}
    </Grid>
  );
}
