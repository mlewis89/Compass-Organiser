"use client";

import { useQuery } from "@apollo/client";
import { useState } from "react";
import {
  Button,
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
import { usePermissions } from "@/lib/client/usePermissions";
import PlaceholderPost from "@/components/placeholder/PlaceholderPost";
import BoardPostFormModal from "@/components/BoardPostFormModal";

export default function BoardPostList({ groupSlug }: { groupSlug?: string }) {
  const { data, refetch } = useQuery<{ boardPosts: BoardPost[] }>(QUERY_BOARDPOST, {
    variables: { groupSlug },
  });
  const { permissions } = usePermissions();
  const [editPost, setEditPost] = useState<BoardPost | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const posts = data?.boardPosts;

  return (
    <>
      <Segment padded>
        <Label attached="top">Notice Board</Label>
        {permissions.canManagePosts ? (
          <Button
            primary
            style={{ marginBottom: "1em" }}
            onClick={() => {
              setEditPost(null);
              setShowFormModal(true);
            }}
          >
            New Post
          </Button>
        ) : null}
        <Grid columns={1} stackable>
          {posts ? (
            posts.map((post) => (
              <GridColumn key={post._id}>
                <Item>
                  {post.image ? <ItemImage size="tiny" src={post.image} /> : null}
                  <ItemContent>
                    <ItemHeader>{post.title}</ItemHeader>
                    <ItemDescription>{post.content}</ItemDescription>
                    <ItemExtra>
                      {` ~ ${post.createdBy?.displayName ?? ""}`}
                      {permissions.canManagePosts ? (
                        <Button
                          size="mini"
                          floated="right"
                          onClick={() => {
                            setEditPost(post);
                            setShowFormModal(true);
                          }}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </ItemExtra>
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
      {showFormModal ? (
        <BoardPostFormModal
          post={editPost}
          open={showFormModal}
          groupSlug={groupSlug}
          onClose={() => setShowFormModal(false)}
          onSaved={() => {
            setShowFormModal(false);
            void refetch();
          }}
          onDeleted={() => {
            setShowFormModal(false);
            void refetch();
          }}
        />
      ) : null}
    </>
  );
}
