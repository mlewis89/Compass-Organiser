"use client";

import { Button, Modal, ModalActions, ModalContent, ModalHeader } from "semantic-ui-react";

type Props = {
  open: boolean;
  header: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  negative?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  header,
  message,
  confirmText = "Yes",
  cancelText = "No",
  negative = true,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal onClose={onCancel} open={open} size="small">
      <ModalHeader>{header}</ModalHeader>
      <ModalContent>
        <p>{message}</p>
      </ModalContent>
      <ModalActions>
        <Button icon="check" content={confirmText} negative={negative} onClick={onConfirm} />
        <Button content={cancelText} onClick={onCancel} />
      </ModalActions>
    </Modal>
  );
}
