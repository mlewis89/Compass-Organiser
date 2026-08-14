"use client";

import { usePathname } from "next/navigation";
import { Segment } from "semantic-ui-react";

export default function NotFound() {
  const pathname = usePathname();
  return (
    <Segment>
      <h1>
        Error: No match for <code>{pathname}</code>
      </h1>
    </Segment>
  );
}
