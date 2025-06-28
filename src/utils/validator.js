const validator=require("validator");

//req.body contains the data which is a js object which is a key value pair
const validate =(data)=>{
  const mandatory = ["firstName","emailId","password"];
  const isAllowed =mandatoryField.every((k)=>Object.keys(data).includes(k));

  if(!isAllowed)
    throw new Error("Field is Missing!!!");

  if(!validator.isEmail(data.emailId))
    throw new Error("Invalid email");

  if(!validator.isStrongPassword(data.password))
    throw new Error("Weak Password");
}

module.exports=validate;