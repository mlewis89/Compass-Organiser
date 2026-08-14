"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { Button, Checkbox, Form, FormField, Input, Modal, Segment, TextArea } from "semantic-ui-react";
import { QUERY_BOARDPOST } from "@/lib/client/queries";
import { ADD_BOARD_POST, DELETE_BOARD_POST, UPDATE_BOARD_POST } from "@/lib/client/mutations";
import type { BoardPost } from "@/lib/client/types";
import ConfirmDialog from "@/components/ConfirmDialog";

const emptyPost: BoardPost = {
  _id: "",
  title: "",
  content: "",
  image: "",
  isPublic: false,
  expiryDate: "",
  Priority: 0,
};

type Props = {
  post: BoardPost | null;
  open: boolean;
  groupSlug?: string;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

export default function BoardPostFormModal({
  post,
  open,
  groupSlug,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const isCreateMode = !post;
  const [postData, setPostData] = useState<BoardPost>(post ?? emptyPost);
  const [deleteCheckOpen, setDeleteCheckOpen] = useState(false);

  useEffect(() => {
    setPostData(post ?? emptyPost);
  }, [post]);

  const refetchQueries = [{ query: QUERY_BOARDPOST, variables: { groupSlug } }];
  const [addBoardPost] = useMutation(ADD_BOARD_POST, { refetchQueries });
  const [updateBoardPost] = useMutation(UPDATE_BOARD_POST, { refetchQueries });
  const [deleteBoardPost] = useMutation(DELETE_BOARD_POST, { refetchQueries });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setPostData({ ...postData, [name]: value });
  };

  return (
    <Modal open={open} onClose={onClose} size="large" dimmer="blurring">
      <Segment>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const variables = {
              title: postData.title,
              content: postData.content,
              image: postData.image,
              isPublic: Boolean(postData.isPublic),
              expiryDate: postData.expiryDate || undefined,
              priority: postData.Priority ? Number(postData.Priority) : undefined,
            };
            if (isCreateMode) {
              void addBoardPost({ variables: { postData: variables } }).then(() =>
                onSaved(),
              );
            } else {
              void updateBoardPost({
                variables: { postId: postData._id, postData: variables },
              }).then(() => onSaved());
            }
          }}
        >
          <FormField
            control={Input}
            value={postData.title ?? ""}
            label="Title"
            name="title"
            onChange={handleChange}
            required
          />
          <FormField
            control={TextArea}
            value={postData.content ?? ""}
            label="Content"
            name="content"
            onChange={handleChange}
          />
          <FormField
            control={Input}
            value={postData.image ?? ""}
            label="Image URL"
            name="image"
            onChange={handleChange}
          />
          <FormField
            control={Input}
            type="date"
            value={postData.expiryDate ? postData.expiryDate.slice(0, 10) : ""}
            label="Expiry Date"
            name="expiryDate"
            onChange={handleChange}
          />
          <FormField
            control={Input}
            type="number"
            value={postData.Priority ?? 0}
            label="Priority"
            name="Priority"
            onChange={handleChange}
          />
          <FormField>
            <Checkbox
              label="Public post"
              checked={Boolean(postData.isPublic)}
              onChange={(_event, checkboxData) =>
                setPostData({ ...postData, isPublic: Boolean(checkboxData.checked) })
              }
            />
          </FormField>
          <Button type="submit" primary>
            {isCreateMode ? "Post" : "Save Changes"}
          </Button>
          {!isCreateMode ? (
            <Button type="button" negative onClick={() => setDeleteCheckOpen(true)}>
              Delete Post
            </Button>
          ) : null}
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </Form>
      </Segment>
      <ConfirmDialog
        open={deleteCheckOpen}
        header="Confirm Delete"
        message={`Are you sure you want to delete "${postData.title}"?`}
        onCancel={() => setDeleteCheckOpen(false)}
        onConfirm={() => {
          void deleteBoardPost({ variables: { postId: postData._id } }).then(() => {
            setDeleteCheckOpen(false);
            onDeleted();
          });
        }}
      />
    </Modal>
  );
}
