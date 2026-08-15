"use client";

import { useQuery } from "@apollo/client";
import { Label, Segment, Statistic } from "semantic-ui-react";
import { QUERY_UNIT_BUCKETS } from "@/lib/client/queries";
import type { UnitBucket } from "@/lib/client/types";

export default function UnitBucketStats() {
  const { loading, data } = useQuery<{ unitBuckets: UnitBucket[] }>(
    QUERY_UNIT_BUCKETS,
  );
  const buckets = data?.unitBuckets ?? [];

  if (loading) {
    return <p>Loading…</p>;
  }

  if (buckets.length === 0) {
    return null;
  }

  return (
    <Segment>
      <Label attached="top">Unit task buckets</Label>
      {/*
        Use Statistic.Group compound namespace — same circular-import
        workaround as MyStats. See semantic-ui-react issue 4507.
      */}
      <Statistic.Group>
        {buckets.map((bucket) => (
          <Statistic key={bucket.unit._id}>
            <Statistic.Value>
              {bucket.allocated}/{bucket.total}
            </Statistic.Value>
            <Statistic.Label>{bucket.unit.name}</Statistic.Label>
          </Statistic>
        ))}
      </Statistic.Group>
    </Segment>
  );
}
