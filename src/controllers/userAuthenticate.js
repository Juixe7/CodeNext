const User = require("../models/user")
const validate = require("../utils/validator");
const register = (req,res)=>{
    try {
        //validate the data
        validate(req.body);
        const {firstName ,emailId,password}=req.body;
        //c
    } 
    catch (error) {
        
    }
}