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
import { INVITE_MEMBER } from "@/lib/client/mutations";
import type { Role } from "@/lib/client/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddMemberModal({ open, onClose, onAdded }: Props) {
  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { data: rolesData } = useQuery<{ roles: Role[] }>(QUERY_ROLES);
  const [inviteMember, { error, loading }] = useMutation(INVITE_MEMBER, {
    refetchQueries: [{ query: QUERY_MEMBERS }],
  });

  const roleOptions = (rolesData?.roles ?? []).map((role) => ({
    text: role.name ?? "",
    value: role._id,
  }));

  const handleClose = () => {
    setEmail("");
    setRoleIds([]);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="small" dimmer="blurring">
      <Segment>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            setSuccessMessage(null);
            void inviteMember({ variables: { member: { email, roleIds } } }).then(
              (result) => {
                const invitationSent = result.data?.inviteMember?.invitationSent;
                setSuccessMessage(
                  invitationSent
                    ? `Invitation emailed to ${email}. They'll be ready to go once they create their account.`
                    : `${email} was added to the group.`,
                );
                setEmail("");
                setRoleIds([]);
                onAdded();
              },
            );
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
          <p>
            If they already have an account they&apos;ll be added to the group
            straight away. Otherwise we&apos;ll email them a link to create their
            account &mdash; their roles will be waiting for them.
          </p>
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
          {successMessage ? <Message positive>{successMessage}</Message> : null}
          <Button type="submit" primary loading={loading}>
            Send Invite
          </Button>
          <Button type="button" onClick={handleClose}>
            Close
          </Button>
        </Form>
      </Segment>
    </Modal>
  );
}
