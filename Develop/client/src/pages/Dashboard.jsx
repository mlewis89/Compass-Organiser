import { Grid, GridColumn, GridRow, Segment, Label } from "semantic-ui-react"
import BoardPostList from "../components/BoardPostList";
import EventList from "../components/EventList";
import MyTasks from "../components/MyTasks";
import MyStats from "../components/MyStats";

const Dashboard = () => {
  

  return (
    <Grid columns={2}>
    <GridRow stretched>
      <GridColumn>
        <Segment padded>
          <Label attached='top'>Notice Board</Label>
          <BoardPostList />
        </Segment>
      </GridColumn>
      <GridColumn>
      <Segment padded>
          <Label attached='top'>Upcoming Events</Label>
          <EventList />
        </Segment><Segment padded>
          <Label attached='top'>My Tasks</Label>
          <MyTasks />
        </Segment>
      </GridColumn>
      </GridRow>
      <GridRow stretched>
      <GridColumn>
      <Label attached='top'>My Stats</Label>
          <MyStats />
        </GridColumn>
        </GridRow>
      </Grid>);
};

export default Dashboard;
