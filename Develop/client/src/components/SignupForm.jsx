import { ModalContent, ModalActions, Button} from "semantic-ui-react";

const SignUpForm = () => {
  return (
    <>
      <ModalContent></ModalContent>
      <ModalActions>
        <Button color="black" onClick={() => {}}>
          Back
        </Button>
        <Button
          content="Sign Up"
          labelPosition="right"
          icon="checkmark"
          onClick={() => {}}
          positive
        />
      </ModalActions>
    </>
  );
};

export default SignUpForm;
