import {
  GridColumn,
  Grid,
  Item,
  ItemExtra,
  ItemDescription,
  ItemContent,
  ItemImage,
  ItemHeader,
  Segment,
  Label,
} from "semantic-ui-react";
import PlaceholderPost from "./placeholder/placeholder-post";
import { useQuery } from "@apollo/client";
import { QUERY_BOARDPOST } from "../utils/queries";

const BoardPostList = () => {
  const { data } = useQuery(QUERY_BOARDPOST);
  let posts;

  if (data) {
    posts = data.boardPosts;
  }

  return (
    <Segment padded>
      <Label attached="top">Notice Board</Label>

      <Grid columns={1} stackable>
        {posts ? (
          <>
            {posts.map((post) => (
              <GridColumn key={post._id}>
                <Item key={post._id}>
                  <ItemImage size="tiny" src={post.image} />
                  <ItemContent>
                    <ItemHeader as="a">{post.title}</ItemHeader>
                    <ItemDescription>{post.content}</ItemDescription>
                    <ItemExtra>
                      {` ~ ${post.createdBy.displayName}`}
                    </ItemExtra>
                  </ItemContent>
                </Item>
              </GridColumn>
            ))}
          </>
        ) : (
          <GridColumn>
            <PlaceholderPost />
          </GridColumn>
        )}
      </Grid>
    </Segment>
  );
};

export default BoardPostList;
