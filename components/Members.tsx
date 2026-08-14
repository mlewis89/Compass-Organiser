"use client";

import { useQuery } from "@apollo/client";
import { useState } from "react";
import {
  Button,
  Label,
  Segment,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";
import { QUERY_MEMBERS } from "@/lib/client/queries";
import type { Member } from "@/lib/client/types";
import { usePermissions } from "@/lib/client/usePermissions";
import AddMemberModal from "@/components/AddMemberModal";
import MemberModal from "@/components/MemberModal";

const headers = [
  "scoutRego",
  "displayName",
  "lastName",
  "status",
  "gender",
  "section",
  "email",
  "phone",
  "taskAvailabity",
] as const;

export default function Members() {
  const { data, loading, refetch } = useQuery<{ members: Member[] }>(QUERY_MEMBERS);
  const { permissions } = usePermissions();
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  if (!data) {
    return null;
  }

  return (
    <>
      <Segment padded>
        <Label attached="top">Members</Label>
        {permissions.canManageMembers ? (
          <Button
            primary
            style={{ marginBottom: "1em" }}
            onClick={() => setShowAddModal(true)}
          >
            Add Member
          </Button>
        ) : null}
        <Table celled selectable striped>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHeaderCell key={header}>{header}</TableHeaderCell>
              ))}
              <TableHeaderCell />
            </TableRow>
          </TableHeader>
          {!loading ? (
            <TableBody>
              {data.members.map((item) => (
                <TableRow key={item._id}>
                  {headers.map((propertyName) => (
                    <TableCell key={item._id + propertyName}>
                      {String(item[propertyName] ?? "")}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button size="tiny" onClick={() => setActiveMemberId(item._id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : null}
        </Table>
      </Segment>
      {activeMemberId ? (
        <MemberModal
          userId={activeMemberId}
          open={Boolean(activeMemberId)}
          onClose={() => setActiveMemberId(null)}
          onChanged={() => void refetch()}
        />
      ) : null}
      {showAddModal ? (
        <AddMemberModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdded={() => void refetch()}
        />
      ) : null}
    </>
  );
}
