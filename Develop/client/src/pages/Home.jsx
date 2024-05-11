import { Container, Grid, GridRow, GridColumn, Segment, Label} from "semantic-ui-react";
import BoardPostList from '../components/BoardPostList';
import EventList from '../components/EventList'

const Home = () => {
  return (
  <Container>
    <Grid columns={2}>
    <GridRow>
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
        </Segment>
      </GridColumn>
      </GridRow>
      </Grid>
    </Container>
);
};

export default Home;
