import {
    GridColumn,
    Grid,
    Segment,
  } from "semantic-ui-react";
import PlaceholderPost from "./placeholder/placeholder-post";
  
  const BoardPostList = () => (
    <Grid columns={1} stackable>
      <GridColumn>
        <Segment raised>
          <PlaceholderPost />
        </Segment>
      </GridColumn>
  
      <GridColumn>
        <Segment raised>
        <PlaceholderPost />
        </Segment>
      </GridColumn>
  
      <GridColumn>
        <Segment raised>
        <PlaceholderPost />
        </Segment>
      </GridColumn>
    </Grid>
  );
  
  export default BoardPostList;