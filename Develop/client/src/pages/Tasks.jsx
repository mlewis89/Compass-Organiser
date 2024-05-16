import { Grid, GridColumn, GridRow, Segment, Label } from "semantic-ui-react";
import MyTasks from "../components/MyTasks";
import SuggestedTasks from "../components/SuggestedTasks";
import TimeSlider from "../components/TimeSlider";
import MySkills from "../components/MySkils";
import AllTasks from "../components/allTasks";

const Tasks = () => {
  return (
    <Grid columns={2}>
      <GridRow stretched>
        <GridColumn>
          <MyTasks />
          <SuggestedTasks />
        </GridColumn>
        <GridColumn>
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
  );
};

export default Tasks;
