const validateEmailAddress = (emailAddress: string) => {
  return /\S+@\S+\.\S+/.test(emailAddress);
};

const validatePassword = (password: string) => {
  return password.length >= 6;
};

export { validateEmailAddress, validatePassword };
