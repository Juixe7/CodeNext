const express=require('express');//to create a router
const authRouter=express.Router();

//register
authRouter.post('/register',register);

//login
authRouter.post('/login',login);

//logout
authRouter.post('/logout',logout)

//Getprofile
authRouter.get('/getProfile',getProfile);
