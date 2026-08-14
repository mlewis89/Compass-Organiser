"use client";

import { useQuery } from "@apollo/client";
import {
  Label,
  Segment,
  Statistic,
  StatisticGroup,
  StatisticLabel,
  StatisticValue,
} from "semantic-ui-react";
import { QUERY_ME_STATS } from "@/lib/client/queries";

type Stat = { name: string; value: string };

export default function MyStats() {
  const { loading, data } = useQuery<{ myStats: Stat[] }>(QUERY_ME_STATS);

  if (loading || !data) {
    return <p>Loading...</p>;
  }

  return (
    <Segment>
      <Label attached="top">My Stats</Label>
      <StatisticGroup widths="five">
        {data.myStats.map((stat) => (
          <Statistic key={stat.name}>
            <StatisticValue>{stat.value}</StatisticValue>
            <StatisticLabel>{stat.name}</StatisticLabel>
          </Statistic>
        ))}
      </StatisticGroup>
    </Segment>
  );
}
