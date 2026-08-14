import {
  Placeholder,
  PlaceholderHeader,
  PlaceholderLine,
  PlaceholderParagraph,
} from "semantic-ui-react";

export default function PlaceholderEvent() {
  return (
    <Placeholder>
      <PlaceholderHeader image>
        <PlaceholderLine />
        <PlaceholderLine />
      </PlaceholderHeader>
      <PlaceholderParagraph>
        <PlaceholderLine length="medium" />
        <PlaceholderLine length="short" />
      </PlaceholderParagraph>
    </Placeholder>
  );
}
