import { ModalContent, ModalActions, Button} from "semantic-ui-react";

const LoginForm = () => {
  return (
    <>
      <ModalContent></ModalContent>
      <ModalActions>
        <Button color="black" onClick={() => {}}>
          Back
        </Button>
        <Button
          content="Login"
          labelPosition="right"
          icon="checkmark"
          onClick={() => {}}
          positive
        />
      </ModalActions>
    </>
  );
};

export default LoginForm;