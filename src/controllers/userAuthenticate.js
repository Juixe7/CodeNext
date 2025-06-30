const User = require("../models/user")
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient=require("../config/redis");

const register = async(req,res)=>{
    try {
        //validate the data
        validate(req.body);
        const {firstName,lastname,emailId,password}=req.body;
        req.body.password = await bcrypt.hash(password,10);
        req.body.role= "user";

        //now the user has registered successfully 
        //now we will create a token and send it to the user
        const user = await User.create(req.body);
        const token = jwt.sign(
          { _id: user._id, emailId: user.emailId ,role:'user'},
          process.env.SECRET_KEY,
          { expiresIn: 60 * 60 } // ✅ this is a plain object now
        );
        res.cookie('token',token,{maxAge:60*60*1000});
        res.status(201).send("User created Successfully!");
    } 
    catch (error) {
        res.status(400).send("Error"+error);
    }
}

const login = async (req, res) => {
  try {
    const { token } = req.cookies;

    // Check if token exists and is valid
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.SECRET_KEY);
        return res.status(200).send("Already logged in.");
      } catch (err) {
        // Token is invalid or expired – continue to login
      }
    }

    const { emailId, password } = req.body;

    if (!emailId || !password) {
      throw new Error("Invalid Credentials");
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const newToken = jwt.sign(
      { _id: user._id, emailId: user.emailId,role:user.role},
      process.env.SECRET_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", newToken, { maxAge: 60 * 60 * 1000 });
    res.status(200).send("Logged in Successfully!");
  } catch (error) {
    res.status(401).send("Error: " + error.message);
  }
};



const logout = async (req, res) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).send("Token not found in cookies");
    }

    const payload = jwt.decode(token);

    if (!payload || !payload.exp) {
      return res.status(400).send("Invalid token");
    }

    // Block the token in Redis
    await redisClient.set(`token:${token}`, "Blocked");
    await redisClient.expireAt(`token:${token}`, payload.exp); // UNIX timestamp in seconds

    // Clear the cookie
    res.clearCookie("token");
    res.send("Logged out Successfully");
  } catch (error) {
    res.status(401).send("Error: " + error.message);
  }
};

const adminRegister =async(req,res)=>{
    try {
        //validate the data
        validate(req.body);
        const {firstName,lastname,emailId,password}=req.body;
        req.body.password = await bcrypt.hash(password,10);
        req.body.role= "admin";

        //now the user has registered successfully 
        //now we will create a token and send it to the user
        const user = await User.create(req.body);
        const token = jwt.sign(
          { _id: user._id, emailId: user.emailId ,role:'admin'},
          process.env.SECRET_KEY,
          { expiresIn: 60 * 60 } // ✅ this is a plain object now
        );
        res.cookie('token',token,{maxAge:60*60*1000});
        res.status(201).send("User created Successfully!");
    } 
    catch (error) {
        res.status(400).send("Error"+error);
    }
}

module.exports ={register,login,logout,adminRegister};