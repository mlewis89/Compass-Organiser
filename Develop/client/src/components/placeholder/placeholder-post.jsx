import {
    PlaceholderParagraph,
    PlaceholderLine,
    PlaceholderHeader,
    Placeholder,
  } from "semantic-ui-react";
  
  const PlaceholderPost = () => {
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
      <PlaceholderLine />
      <PlaceholderLine />
    </PlaceholderParagraph>
  </Placeholder>
    );
}
export default PlaceholderPost;