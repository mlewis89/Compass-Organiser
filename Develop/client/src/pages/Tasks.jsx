import { Grid, GridColumn, GridRow, Segment, Label } from "semantic-ui-react";
import MyTasks from "../components/MyTasks";
import SuggestedTasks from "../components/SuggestedTasks";
import TimeSlider from "../components/TimeSlider";
import MySkills from "../components/MySkils";
import AllTasks from "../components/AllTasks";

const Tasks = () => {
  return (
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
  );
};

export default Tasks;
