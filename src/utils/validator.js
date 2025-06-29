const validator = require("validator");

const validate = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error("Invalid input: data must be a non-null object");
  }

  const mandatory = ["firstName", "emailId", "password"];
  const isAllowed = mandatory.every((k) => Object.keys(data).includes(k));

  if (!isAllowed)
    throw new Error("Field is Missing!!!");

  if (!validator.isEmail(data.emailId))
    throw new Error("Invalid email");

  if (!validator.isStrongPassword(data.password))
    throw new Error("Weak Password");
};

module.exports = validate;
