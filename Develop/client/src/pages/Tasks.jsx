import { Grid, GridColumn, GridRow, Segment, Label } from "semantic-ui-react";
import MyTasks from "../components/MyTasks";
import SuggestedTasks from "../components/SuggestedTasks";
import TimeSlider from "../components/TimeSlider";
import MySkills from "../components/MySkils";
import AllTasks from "../components/AllTasks";

const Tasks = () => {
  return (
    <Grid columns={2}>
      <GridRow stretched>
        <GridColumn>
          <Segment padded>
            <Label attached="top">My Tasks</Label>
            <MyTasks />
          </Segment>
        </GridColumn>
        <GridColumn>
          <Segment padded>
            <Label attached="top">Suggested Tasks</Label>
            <SuggestedTasks />
          </Segment>
        </GridColumn>
      </GridRow>
      <GridRow stretched>
        <GridColumn>
          <Segment padded>
            <Label attached="top">My Skills</Label>
            <MySkills />
          </Segment>
        </GridColumn>
        <GridColumn>
          <Segment padded>
            <Label attached="top">My Time Availabilty</Label>
            <TimeSlider />
          </Segment>
        </GridColumn>
      </GridRow>
      <GridRow stretched columns={1}>
        <GridColumn>
          <Segment padded>
            <Label attached="top">All Tasks</Label>
            <AllTasks />
          </Segment>
        </GridColumn>
        
      </GridRow>
    </Grid>
  );
};

export default Tasks;
