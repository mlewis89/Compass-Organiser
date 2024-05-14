import {
  Button,
  Form,
  FormField,
  Input,
} from "semantic-ui-react";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { ADD_USER } from "../utils/mutations";
import Auth from "../utils/auth";

const SignUpForm = () => {
  const [userFormData, setUserFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agree: false,
  });
  const [FormErrors, setFormErrors] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    agree: false,
  });

  const [showAlert, setShowAlert] = useState(false);

  const [addUser, { error }] = useMutation(ADD_USER);

  const handleOnBlur = (event)=>{
    const { name, value } = event.target;
    return validateInput({name, value})
  }
  const validateInput = (name,value) => {
    var invalidData = false;
    switch (name) {
      case "firstName":
        if (!value) {
          setFormErrors({ ...FormErrors, [name]: true });
          invalidData = true;
        } else {
          setFormErrors({ ...FormErrors, [name]: false });
        }
        break;
      case "lastName":
        if (!value) {
          setFormErrors({ ...FormErrors, [name]: true });
          
          invalidData = true;
        } else {
          setFormErrors({ ...FormErrors, [name]: false });
        }
        break;
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
      case "agree":
        if (!value) {
          setFormErrors({ ...FormErrors, [name]: true });
          invalidData = true;
        } else {
          setFormErrors({ ...FormErrors, [name]: false });
        }
        break;
    }
    console.log(FormErrors)
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
      if (!validateInput(i,userFormData.i)) {
        validData = false;
      }
    }
    return validData;
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    let user = {...userFormData};
    delete user.agree;

    if (validateForm()) {
      try {
        const { data } = await addUser({ 
          variables: {user}  
        });
        if (error) {
          throw new Error("something went wrong!");
        }
        Auth.login(data.addUser.token);
      } catch (error) {
        console.error(error);
        setShowAlert(true);
      }

      setUserFormData({
        firstName: "",
        lastName: "",
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
          name="firstName"
          error={FormErrors.firstName}
          label="First Name"
          placeholder="First name"
          value={userFormData.firstName}
          onChange={handleInputChange}
          onBlur={handleOnBlur}
        />
        <FormField
          control={Input}
          name="lastName"
          label="Last Name"
          placeholder="Last name"
          value={userFormData.lastName}
          onChange={handleInputChange}
          error={FormErrors.lastName}
          onBlur={handleOnBlur}
        />
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
        <FormField
          control="input"
          type="checkbox"
          name="agree"
          label="I agree to the Terms and Conditions"
          error={FormErrors.agree}
          onChange={handleInputChange}
          
          value={userFormData.agree}
        />
        <Button type="submit">Sign Up</Button>
        <Button type="close">Close</Button>
      </Form>
    </>
  );
};

export default SignUpForm;
