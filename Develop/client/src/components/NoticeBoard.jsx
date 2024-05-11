import {
    GridColumn,
    Grid,
    Segment,
  } from 'semantic-ui-react'
  
import PlaceholderPost from './placeholder/placeholder-post'

  const NoticeBoard = () => (
    <Grid columns={3} stackable>
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
  )
  
  export default NoticeBoard