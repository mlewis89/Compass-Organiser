"use client";

import { Grid, GridColumn, GridRow } from "semantic-ui-react";
import MyTasks from "@/components/MyTasks";
import SuggestedTasks from "@/components/SuggestedTasks";
import TimeSlider from "@/components/TimeSlider";
import MySkills from "@/components/MySkills";
import AllTasks from "@/components/AllTasks";
import RequireGroupModule from "@/components/RequireGroupModule";

export default function TasksPage() {
  return (
    <RequireGroupModule module="tasks">
      <Grid doubling stackable className="tasks-page-grid">
        <GridRow stretched>
          <GridColumn width={10} className="tasks-page-main">
            <MyTasks />
            <SuggestedTasks />
          </GridColumn>
          <GridColumn width={6} className="tasks-page-sidebar">
            <TimeSlider />
            <MySkills />
          </GridColumn>
        </GridRow>
        <GridRow stretched columns={1}>
          <GridColumn className="tasks-page-all">
            <AllTasks />
          </GridColumn>
        </GridRow>
      </Grid>
    </RequireGroupModule>
  );
}
