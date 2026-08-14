"use client";

import { useQuery } from "@apollo/client";
import {
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
  const { data, loading } = useQuery<{ members: Member[] }>(QUERY_MEMBERS);

  if (!data) {
    return null;
  }

  return (
    <Segment padded>
      <Label attached="top">Members</Label>
      <Table celled selectable striped>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHeaderCell key={header}>{header}</TableHeaderCell>
            ))}
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
              </TableRow>
            ))}
          </TableBody>
        ) : null}
      </Table>
    </Segment>
  );
}
