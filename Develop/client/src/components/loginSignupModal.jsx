import { Modal } from "semantic-ui-react";

import { TabPane, Tab } from "semantic-ui-react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignupForm";

function LoginSignUpModal({ showModal }) {
  return (
    <Modal
      centered={false}
      onClose={() => {}}
      onOpen={() => {}}
      open={showModal}
      aria-labelledby="signup-modal"
      size="small"
      dimmer="blurring"
    >
      <Tab
        menu={{ secondary: true, pointing: true }}
        panes={[
          {
            menuItem: "Login",
            render: () => (
              <TabPane attached={false}>
                <LoginForm />
              </TabPane>
            ),
          },
          {
            menuItem: "Sign up",
            render: () => (
              <TabPane attached={false}>
                <SignUpForm />
              </TabPane>
            ),
          },
        ]}
      />
    </Modal>
  );
}

export default LoginSignUpModal;
