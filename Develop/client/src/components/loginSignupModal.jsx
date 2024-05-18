import { Modal } from "semantic-ui-react";

import { TabPane, Tab } from "semantic-ui-react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignupForm";

function LoginSignUpModal({ showModal, setShowModal }) {
  return (
    <Modal
      centered={false}
      onClose={() => {setShowModal(false)}}
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
                <LoginForm setShowModal={setShowModal}/>
              </TabPane>
            ),
          },
          {
            menuItem: "Sign up",
            render: () => (
              <TabPane attached={false}>
                <SignUpForm setShowModal={setShowModal}/>
              </TabPane>
            ),
          },
        ]}
      />

    </Modal>
  );
}

export default LoginSignUpModal;
