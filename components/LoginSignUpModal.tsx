"use client";

import { Modal, Tab, TabPane } from "semantic-ui-react";
import LoginForm from "@/components/LoginForm";
import SignUpForm from "@/components/SignUpForm";

type Props = {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
};

export default function LoginSignUpModal({ showModal, setShowModal }: Props) {
  return (
    <Modal
      centered={false}
      onClose={() => setShowModal(false)}
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
                <LoginForm setShowModal={setShowModal} />
              </TabPane>
            ),
          },
          {
            menuItem: "Sign up",
            render: () => (
              <TabPane attached={false}>
                <SignUpForm setShowModal={setShowModal} />
              </TabPane>
            ),
          },
        ]}
      />
    </Modal>
  );
}
