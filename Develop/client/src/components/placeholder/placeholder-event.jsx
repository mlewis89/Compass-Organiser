import {
  PlaceholderParagraph,
  PlaceholderLine,
  PlaceholderHeader,
  Placeholder,
} from "semantic-ui-react";

const PlaceholderEvent = () => {
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
};

export default PlaceholderEvent;
