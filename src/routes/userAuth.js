const express=require('express');//to create a router
const authRouter=express.Router();
const {register,login,logout}=require("../controllers/userAuthenticate");


//register
authRouter.post('/register',register);

//login
authRouter.post('/login',login);

//logout
authRouter.post('/logout',logout)

// //Getprofile
// authRouter.get('/getProfile',getProfile);

module.exports =authRouter;
