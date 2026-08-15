"use client";

import { useEffect } from "react";
import { Button, Message, Segment } from "semantic-ui-react";

export default function AppSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App section error boundary caught:", error);
  }, [error]);

  return (
    <Segment padded>
      <Message negative>
        <Message.Header>Something went wrong loading this page</Message.Header>
        <p>
          This is usually a one-off glitch. Try again, or reload the page if
          it keeps happening.
        </p>
      </Message>
      <Button primary onClick={() => reset()}>
        Try again
      </Button>
      <Button onClick={() => window.location.reload()}>Reload page</Button>
    </Segment>
  );
}
