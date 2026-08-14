"use client";

import { useMutation } from "@apollo/client";
import { useState } from "react";
import { Button, Form, FormField, Input } from "semantic-ui-react";
import { ADD_USER } from "@/lib/client/mutations";
import Auth from "@/lib/client/auth";

export default function SignUpForm({
  setShowModal,
}: {
  setShowModal: (open: boolean) => void;
}) {
  const [userFormData, setUserFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
  });
  const [addUser] = useMutation(ADD_USER);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserFormData({ ...userFormData, [name]: value });
    setFormErrors({ ...formErrors, [name]: !value });
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      firstName: !userFormData.firstName,
      lastName: !userFormData.lastName,
      email: !userFormData.email,
      password: !userFormData.password,
    };
    setFormErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const { data } = await addUser({ variables: { user: userFormData } });
    Auth.login(data.addUser.token);
  };

  return (
    <Form onSubmit={handleFormSubmit}>
      <FormField
        control={Input}
        name="firstName"
        label="First Name"
        placeholder="First name"
        value={userFormData.firstName}
        onChange={handleInputChange}
        error={formErrors.firstName}
      />
      <FormField
        control={Input}
        name="lastName"
        label="Last Name"
        placeholder="Last name"
        value={userFormData.lastName}
        onChange={handleInputChange}
        error={formErrors.lastName}
      />
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
      <Button type="submit">Sign Up</Button>
      <Button type="button" onClick={() => setShowModal(false)}>
        Close
      </Button>
    </Form>
  );
}
