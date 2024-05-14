import {
  Statistic,
  StatisticValue,
  StatisticLabel,
  Segment,
  StatisticGroup,
} from "semantic-ui-react";

const MyStats = () => {
  return (
    <Segment>
      <StatisticGroup>
        <Statistic>
          <StatisticValue>50</StatisticValue>
          <StatisticLabel>members</StatisticLabel>
        </Statistic>
        <Statistic>
          <StatisticValue>50</StatisticValue>
          <StatisticLabel>Tasks</StatisticLabel>
        </Statistic>
        <Statistic>
          <StatisticValue>50</StatisticValue>
          <StatisticLabel>Events</StatisticLabel>
        </Statistic>
      </StatisticGroup>
    </Segment>
  );
};

export default MyStats;
