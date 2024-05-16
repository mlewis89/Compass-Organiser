import { Button, Form, FormField, Input } from "semantic-ui-react";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN } from "../utils/mutations";
import Auth from "../utils/auth";

const LoginForm = () => {
  const [userFormData, setUserFormData] = useState({
    email: "",
    password: "",
  });
  const [FormErrors, setFormErrors] = useState({
    email: false,
    password: false,
  });

  const [showAlert, setShowAlert] = useState(false);

  const [login, { error }] = useMutation(LOGIN);

  const handleOnBlur = (event) => {
    const { name, value } = event.target;
    return validateInput({ name, value });
  };
  const validateInput = (name, value) => {
    var invalidData = false;
    switch (name) {
      case "email":
        if (!value) {
          setFormErrors({ ...FormErrors, [name]: true });

          invalidData = true;
        } else {
          setFormErrors({ ...FormErrors, [name]: false });
        }
        break;
      case "password":
        if (!value) {
          setFormErrors({ ...FormErrors, [name]: true });

          invalidData = true;
        } else {
          setFormErrors({ ...FormErrors, [name]: false });
        }
        break;
    }
    console.log(FormErrors);
    return invalidData;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserFormData({ ...userFormData, [name]: value });
    validateInput({ name, value });
  };

  const validateForm = () => {
    var validData = true;
    for (let i in userFormData) {
      if (!validateInput(i, userFormData.i)) {
        validData = false;
      }
    }
    return validData;
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      try {
        const { data } = await login({
          variables: { ...userFormData },
        });
        if (error) {
          throw new Error("something went wrong!");
        }
        Auth.login(data.login.token);
      } catch (error) {
        console.error(error);
        setShowAlert(true);
      }

      setUserFormData({
        email: "",
        password: "",
      });
    }
  };

  return (
    <>
      <Form onSubmit={handleFormSubmit}>
        <FormField
          control={Input}
          name="email"
          label="Email Address"
          placeholder="email"
          value={userFormData.email}
          onChange={handleInputChange}
          error={FormErrors.email}
          onBlur={handleOnBlur}
        />
        <FormField
          control={Input}
          name="password"
          label="Password"
          placeholder="password"
          value={userFormData.password}
          type="password"
          onChange={handleInputChange}
          error={FormErrors.password}
          onBlur={handleOnBlur}
        />
        <Button type="submit">Login</Button>
        <Button type="close">Close</Button>
      </Form>
    </>
  );
};

export default LoginForm;
