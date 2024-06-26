import { Grid, GridColumn, GridRow, Segment, Label } from "semantic-ui-react";
import BoardPostList from "../components/BoardPostList";
import EventList from "../components/EventList";
import MyTasks from "../components/MyTasks";
import MyStats from "../components/MyStats";

const Dashboard = () => {
  return (
    <Grid stackable doubling>
      <GridRow stretched columns={2}>
        <GridColumn width={7}>
            <BoardPostList />
        </GridColumn>
        <GridColumn width={9}>
          <EventList />
            <MyTasks />
        </GridColumn>
      </GridRow>
      <GridRow stretched columns={1}>
        <GridColumn>
          <MyStats />
        </GridColumn>
      </GridRow>
    </Grid>
  );
};

export default Dashboard;
