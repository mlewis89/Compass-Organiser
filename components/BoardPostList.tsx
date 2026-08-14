"use client";

import { useQuery } from "@apollo/client";
import {
  Grid,
  GridColumn,
  Item,
  ItemContent,
  ItemDescription,
  ItemExtra,
  ItemHeader,
  ItemImage,
  Label,
  Segment,
} from "semantic-ui-react";
import { QUERY_BOARDPOST } from "@/lib/client/queries";
import type { BoardPost } from "@/lib/client/types";
import PlaceholderPost from "@/components/placeholder/PlaceholderPost";

export default function BoardPostList({ groupSlug }: { groupSlug?: string }) {
  const { data } = useQuery<{ boardPosts: BoardPost[] }>(QUERY_BOARDPOST, {
    variables: { groupSlug },
  });
  const posts = data?.boardPosts;

  return (
    <Segment padded>
      <Label attached="top">Notice Board</Label>
      <Grid columns={1} stackable>
        {posts ? (
          posts.map((post) => (
            <GridColumn key={post._id}>
              <Item>
                {post.image ? <ItemImage size="tiny" src={post.image} /> : null}
                <ItemContent>
                  <ItemHeader as="a">{post.title}</ItemHeader>
                  <ItemDescription>{post.content}</ItemDescription>
                  <ItemExtra>{` ~ ${post.createdBy?.displayName ?? ""}`}</ItemExtra>
                </ItemContent>
              </Item>
            </GridColumn>
          ))
        ) : (
          <GridColumn>
            <PlaceholderPost />
          </GridColumn>
        )}
      </Grid>
    </Segment>
  );
}
