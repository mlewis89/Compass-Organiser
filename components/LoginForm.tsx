"use client";

import { useMutation } from "@apollo/client";
import { useState } from "react";
import { Button, Form, FormField, Input } from "semantic-ui-react";
import { LOGIN } from "@/lib/client/mutations";
import Auth from "@/lib/client/auth";

export default function LoginForm({
  setShowModal,
}: {
  setShowModal: (open: boolean) => void;
}) {
  const [userFormData, setUserFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({ email: false, password: false });
  const [login] = useMutation(LOGIN);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserFormData({ ...userFormData, [name]: value });
    setFormErrors({ ...formErrors, [name]: !value });
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      email: !userFormData.email,
      password: !userFormData.password,
    };
    setFormErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    const { data } = await login({ variables: { ...userFormData } });
    Auth.login(data.login.token);
  };

  return (
    <Form onSubmit={handleFormSubmit}>
      <FormField
        control={Input}
        name="email"
        label="Email Address"
        placeholder="email"
        value={userFormData.email}
        onChange={handleInputChange}
        error={formErrors.email}
      />
      <FormField
        control={Input}
        name="password"
        label="Password"
        placeholder="password"
        value={userFormData.password}
        type="password"
        onChange={handleInputChange}
        error={formErrors.password}
      />
      <Button type="submit">Login</Button>
      <Button type="button" onClick={() => setShowModal(false)}>
        Close
      </Button>
    </Form>
  );
}
