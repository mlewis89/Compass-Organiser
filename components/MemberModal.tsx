"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  Button,
  Dropdown,
  Form,
  FormField,
  Input,
  Label,
  Modal,
  Segment,
} from "semantic-ui-react";
import { QUERY_MEMBERS, QUERY_ROLES, QUERY_SINGLE_MEMBER } from "@/lib/client/queries";
import {
  ASSIGN_MEMBER_ROLE,
  REMOVE_MEMBER,
  REMOVE_MEMBER_ROLE,
  SET_MEMBER_STATUS,
  UPDATE_MEMBER,
} from "@/lib/client/mutations";
import type { Member, Role } from "@/lib/client/types";
import { usePermissions } from "@/lib/client/usePermissions";
import ConfirmDialog from "@/components/ConfirmDialog";

const emptyMember: Member = {
  _id: "",
  firstName: "",
  lastName: "",
  preferredName: "",
  scoutName: "",
  scoutRego: "",
  status: "",
  gender: "",
  dob: "",
  section: "",
  email: "",
  phone: "",
};

type Props = {
  userId: string;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export default function MemberModal({ userId, open, onClose, onChanged }: Props) {
  const { permissions } = usePermissions();
  const [memberData, setMemberData] = useState<Member>(emptyMember);
  const [removeCheckOpen, setRemoveCheckOpen] = useState(false);

  const { data, refetch } = useQuery<{ singleMember: Member }>(QUERY_SINGLE_MEMBER, {
    variables: { userId },
  });
  const { data: rolesData } = useQuery<{ roles: Role[] }>(QUERY_ROLES);

  useEffect(() => {
    if (data?.singleMember) {
      setMemberData(data.singleMember);
    }
  }, [data]);

  const refetchQueries = [{ query: QUERY_MEMBERS }];
  const [updateMember] = useMutation(UPDATE_MEMBER, { refetchQueries });
  const [setMemberStatus] = useMutation(SET_MEMBER_STATUS, { refetchQueries });
  const [removeMember] = useMutation(REMOVE_MEMBER, { refetchQueries });
  const [assignMemberRole] = useMutation(ASSIGN_MEMBER_ROLE, { refetchQueries });
  const [removeMemberRole] = useMutation(REMOVE_MEMBER_ROLE, { refetchQueries });

  const canManage = Boolean(permissions.canManageMembers);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setMemberData({ ...memberData, [name]: value });
  };

  const currentRoleIds = new Set((memberData.role ?? []).map((role) => role._id));
  const roleOptions = (rolesData?.roles ?? []).map((role) => ({
    text: role.name ?? "",
    value: role._id,
  }));

  return (
    <Modal open={open} onClose={onClose} size="large" dimmer="blurring">
      <Segment>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void updateMember({
              variables: {
                userId,
                user: {
                  firstName: memberData.firstName,
                  lastName: memberData.lastName,
                  preferredName: memberData.preferredName,
                  scoutName: memberData.scoutName,
                  scoutRego: memberData.scoutRego,
                  status: memberData.status,
                  gender: memberData.gender,
                  dob: memberData.dob,
                  section: memberData.section,
                  email: memberData.email,
                  phone: memberData.phone,
                },
              },
            }).then(() => onChanged());
          }}
        >
          <FormField
            control={Input}
            value={memberData.firstName ?? ""}
            label="First Name"
            name="firstName"
            onChange={handleChange}
            disabled={!canManage}
          />
          <FormField
            control={Input}
            value={memberData.lastName ?? ""}
            label="Last Name"
            name="lastName"
            onChange={handleChange}
            disabled={!canManage}
          />
          <FormField
            control={Input}
            value={memberData.scoutName ?? ""}
            label="Scout Name"
            name="scoutName"
            onChange={handleChange}
            disabled={!canManage}
          />
          <FormField
            control={Input}
            value={memberData.email ?? ""}
            label="Email"
            name="email"
            onChange={handleChange}
            disabled={!canManage}
          />
          <FormField
            control={Input}
            value={memberData.phone ?? ""}
            label="Phone"
            name="phone"
            onChange={handleChange}
            disabled={!canManage}
          />
          <FormField
            control={Input}
            value={memberData.section ?? ""}
            label="Section"
            name="section"
            onChange={handleChange}
            disabled={!canManage}
          />
          <FormField
            control={Input}
            value={memberData.status ?? ""}
            label="Status"
            name="status"
            onChange={handleChange}
            disabled={!canManage}
          />
          <FormField>
            <label>Roles</label>
            {(memberData.role ?? []).map((role) => (
              <Label key={role._id} style={{ marginBottom: "0.25em" }}>
                {role.name}
                {canManage ? (
                  <Label.Detail
                    as="a"
                    onClick={() =>
                      void removeMemberRole({
                        variables: { userId, roleId: role._id },
                      }).then(() => refetch())
                    }
                  >
                    x
                  </Label.Detail>
                ) : null}
              </Label>
            ))}
            {canManage ? (
              <Dropdown
                placeholder="Add role"
                selection
                options={roleOptions.filter((option) => !currentRoleIds.has(option.value))}
                onChange={(_event, dropdownData) => {
                  const roleId = String(dropdownData.value ?? "");
                  if (roleId) {
                    void assignMemberRole({ variables: { userId, roleId } }).then(() =>
                      refetch(),
                    );
                  }
                }}
              />
            ) : null}
          </FormField>
          {canManage ? <Button type="submit">Save Changes</Button> : null}
          {canManage ? (
            <Button
              type="button"
              onClick={() =>
                void setMemberStatus({
                  variables: {
                    userId,
                    status: memberData.status === "active" ? "inactive" : "active",
                  },
                }).then(() => onChanged())
              }
            >
              {memberData.status === "active" ? "Deactivate" : "Reactivate"}
            </Button>
          ) : null}
          {canManage ? (
            <Button type="button" negative onClick={() => setRemoveCheckOpen(true)}>
              Remove from Group
            </Button>
          ) : null}
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </Form>
      </Segment>
      <ConfirmDialog
        open={removeCheckOpen}
        header="Confirm Remove"
        message={`Remove ${memberData.displayName ?? "this member"} from the group?`}
        onCancel={() => setRemoveCheckOpen(false)}
        onConfirm={() => {
          void removeMember({ variables: { userId } }).then(() => {
            setRemoveCheckOpen(false);
            onClose();
            onChanged();
          });
        }}
      />
    </Modal>
  );
}
