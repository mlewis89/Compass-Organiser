import {
  Statistic,
  StatisticValue,
  StatisticLabel,
  Segment,
  StatisticGroup,
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import { QUERY_ME_STATS } from "../utils/queries";

const MyStats = () => {
const {loading, data} = useQuery(QUERY_ME_STATS);

if(loading)
  {
    return <p>Loading...</p>
  }
else
{
  console.log(data);
  let stats = data.myStats;

  return (
    <Segment>
      <StatisticGroup widths={stats.length}>
        {stats.map((stat)=>(
          <Statistic key={stat.name}>
          <StatisticValue>{stat.value}</StatisticValue>
          <StatisticLabel>{stat.name}</StatisticLabel>
        </Statistic>

        ))}
      </StatisticGroup>
    </Segment>
  );
}
};

export default MyStats;
