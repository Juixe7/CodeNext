const mongoose = require("mongoose");
require('dotenv').config();
async function main(){
    mongoose.connect(process.env.DB_Connect_String);
    console.log("Data base is connected!")
}

module.exports = main;