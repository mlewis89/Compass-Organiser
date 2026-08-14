import {
  Placeholder,
  PlaceholderHeader,
  PlaceholderLine,
  PlaceholderParagraph,
} from "semantic-ui-react";

export default function PlaceholderPost() {
  return (
    <Placeholder>
      <PlaceholderHeader image>
        <PlaceholderLine />
        <PlaceholderLine />
      </PlaceholderHeader>
      <PlaceholderParagraph>
        <PlaceholderLine />
        <PlaceholderLine />
        <PlaceholderLine />
        <PlaceholderLine />
      </PlaceholderParagraph>
    </Placeholder>
  );
}
