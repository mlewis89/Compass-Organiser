"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import {
  Button,
  Form,
  FormField,
  Input,
  Message,
  Modal,
  Segment,
  Select,
} from "semantic-ui-react";
import { QUERY_MEMBERS, QUERY_ROLES } from "@/lib/client/queries";
import { ADD_MEMBER } from "@/lib/client/mutations";
import type { Role } from "@/lib/client/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddMemberModal({ open, onClose, onAdded }: Props) {
  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const { data: rolesData } = useQuery<{ roles: Role[] }>(QUERY_ROLES);
  const [addMember, { error, loading }] = useMutation(ADD_MEMBER, {
    refetchQueries: [{ query: QUERY_MEMBERS }],
  });

  const roleOptions = (rolesData?.roles ?? []).map((role) => ({
    text: role.name ?? "",
    value: role._id,
  }));

  const handleClose = () => {
    setEmail("");
    setRoleIds([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="small" dimmer="blurring">
      <Segment>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void addMember({ variables: { member: { email, roleIds } } }).then(() => {
              handleClose();
              onAdded();
            });
          }}
        >
          <FormField
            control={Input}
            label="Member Email"
            placeholder="person@example.com"
            value={email}
            onChange={(inputEvent: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(inputEvent.target.value)
            }
            required
          />
          <p>The person must already have an account (they need to sign up first).</p>
          <FormField
            control={Select}
            label="Roles"
            multiple
            options={roleOptions}
            value={roleIds}
            onChange={(
              _event: unknown,
              selectData: { value?: string[] },
            ) => setRoleIds(selectData.value ?? [])}
          />
          {error ? <Message negative>{error.message}</Message> : null}
          <Button type="submit" primary loading={loading}>
            Add Member
          </Button>
          <Button type="button" onClick={handleClose}>
            Cancel
          </Button>
        </Form>
      </Segment>
    </Modal>
  );
}
