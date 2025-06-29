const User = require("../models/user")
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async(req,res)=>{
    try {
        //validate the data
        validate(req.body);
        const {firstName ,emailId,password}=req.body;
        req.body.password = await bcrypt.hash(password,10);

        //now the user has registered successfully 
        //now we will create a token and send it to the user
        const user = await User.create(req.body);

        const token=jwt.sign({_id:User._id,emailId:emailId},process.env.SECRET_KEY,60*60);
        res.cookie('token',token,{maxAge:60*60*1000});
        res.status(201).send("User created Successfully!");
    } 
    catch (error) {
        res.status(400).send("Error"+error);
    }
}

const login = async(req,res)=>{
  try {
    const {emailId,password}=req.body;

    if(!emailId)
        throw new Error("Invalid Credentials")
    
    if(!password)
        throw new Error("Invalid Credentials")

    const user=User.findOne({emailId});

     if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const pass = user.password;
     const isMatch=await bcrypt.compare(pass,password);

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const token = jwt.sign({_id:user._id,emailId:emailId},process.env.SECRET_KEY,{expiresIn:60*60});
    res.cookie('token',token,{maxAge:60*60*1000});

    res.status(204).send("Logged in Succesfully!");


  } 
  catch (error) {
    res.status(401).send("Error"+error);
  }
}