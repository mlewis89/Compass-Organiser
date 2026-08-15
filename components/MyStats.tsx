"use client";

import { useQuery } from "@apollo/client";
import { Label, Segment, Statistic } from "semantic-ui-react";
import { QUERY_ME_STATS } from "@/lib/client/queries";

type Stat = { name: string; value: string };

export default function MyStats() {
  const { loading, data } = useQuery<{ myStats: Stat[] }>(QUERY_ME_STATS);

  if (loading || !data?.myStats) {
    return <p>Loading...</p>;
  }

  return (
    <Segment>
      <Label attached="top">My Stats</Label>
      {/*
        Use the Statistic.Group / Statistic.Value / Statistic.Label compound
        namespace instead of importing StatisticGroup/StatisticValue/StatisticLabel
        directly from the barrel — direct imports of these "Group" style
        sub-components hit a known semantic-ui-react circular-dependency bug in
        production webpack builds ("Cannot access 'X' before initialization").
        See https://github.com/Semantic-Org/Semantic-UI-React/issues/4507
      */}
      <Statistic.Group widths="five">
        {data.myStats.map((stat) => (
          <Statistic key={stat.name}>
            <Statistic.Value>{stat.value}</Statistic.Value>
            <Statistic.Label>{stat.name}</Statistic.Label>
          </Statistic>
        ))}
      </Statistic.Group>
    </Segment>
  );
}
