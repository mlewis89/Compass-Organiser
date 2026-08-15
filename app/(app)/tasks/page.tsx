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
      <Grid doubling stackable>
        <GridRow stretched>
          <GridColumn width={10}>
            <MyTasks />
            <SuggestedTasks />
          </GridColumn>
          <GridColumn width={6}>
            <TimeSlider />
            <MySkills />
          </GridColumn>
        </GridRow>
        <GridRow stretched columns={1}>
          <GridColumn>
            <AllTasks />
          </GridColumn>
        </GridRow>
      </Grid>
    </RequireGroupModule>
  );
}
