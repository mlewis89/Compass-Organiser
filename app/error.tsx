"use client";

import { useEffect } from "react";
import { Button, Message, Segment } from "semantic-ui-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="ui container" style={{ marginTop: "2em" }}>
      <Segment padded>
        <Message negative>
          <Message.Header>Something went wrong</Message.Header>
          <p>
            The page hit an unexpected error. This is usually fixed by
            reloading.
          </p>
        </Message>
        <Button primary onClick={() => reset()}>
          Try again
        </Button>
        <Button onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </Segment>
    </div>
  );
}
