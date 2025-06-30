const { kMaxLength } = require("buffer");
const { maxHeaderSize } = require("http");
const mongoose =require("mongoose");
const { type } = require("os");
const { init } = require("./user");
const {Schema}=mongoose;

const problemSchema = new Schema({
    title:{
        type:String,
        required:true,
        minLength:3,
        maxLength:100   
    },
    description:{
        type:String,
        required:true,
        minLength:10,
        maxLength:1000
    },
    type:{
        type:String,
        enum:["easy","medium","hard"],
        required:true
    },
    tags:{
        type:String,
        enum:["array","string","linkedlist","tree","graph","stack","queue","hashing","dynamic programming","greedy","backtracking"],
        required:true
    },
    visibleTestCases:[
        {
            input:
            {
                type:String,
                required:true
            },
            output:
            {
                type:String,
                required:true
            },
            explaination:
            {
                type:String,
                required:true
            }
        }
    ],

    hiddenTestCases:[
        {
            input:
            {
                type:String,
                required:true
            },
            output:
            {
                type:String,
                required:true
            }
        }
    ],
    startCode:[
        {
        language:{
            type:String,
            required:true,
        },
        initialCode:{
            type:String,
            required:true
        }
    }
    ],

    problemCreator:{
        type:Schema.Types.ObjectId,//Schema.types gives multiple schemas
        ref:"user",//we referenced the user schema here
        required:true,
    }
    
   
});

const Problem = mongoose.mongodel("problem",problemSchema);

module.exports = Problem;