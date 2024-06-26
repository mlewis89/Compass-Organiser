import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Segment,
  Label
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import { QUERY_MEMBERS } from "../utils/queries";

const Members = () => {
  const { loading, data } = useQuery(QUERY_MEMBERS);

  let TableHeaderArr = [
    "scoutRego",
    "displayName",
   // "firstName",
    "lastName",
   // "preferredName",
   // "scoutName",
    "status",
    "gender",
    //"dob",
    "section",
    "email",
    "phone",
    "taskAvailabity",
  ];

  if (data) {
    const dataArr = data.members;

    let cleanArr = dataArr.map((dataObj) => {
      let cleanObj = {};
      for (let property in dataObj) {
        if (
          typeof dataObj[property] === "number" ||
          typeof dataObj[property] === "string" ||
          typeof dataObj[property] === "number" ||
          typeof dataObj[property] === "boolean"
        ) {
          cleanObj[property] = dataObj[property];
        }
      }
      return cleanObj;
    });

    return (
      <Segment padded>
            <Label attached="top">Members</Label>
            <Table celled selectable striped>
        <TableHeader>
          <TableRow>
            {TableHeaderArr.map((header) => (
              <TableHeaderCell key={header}>{header}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        {!loading ? (
          <TableBody>
            {cleanArr.map((item) => (
              <TableRow key={item._id}>
                {TableHeaderArr.map((propertyName) => (
                  <TableCell key={item._id + propertyName}>
                    {item[propertyName]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        ) : (
          <></>
        )}
      </Table>
      </Segment>
    );
  } else {
    return <></>;
  }
};

export default Members;
