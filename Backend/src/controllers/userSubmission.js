const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");

const {getLanguageById,submitBatch,submitToken}=require("../utils/problemUtility");
const submitCode = async(req,res)=>{
    try {
        const userId= req.result._id;
        const problemId = req.params.id;
        const{code,language}=req.body;

        if(!userId || !problemId || !code || !language){
            res.status(400).send("All Fields are required");
            return;
        } 

        //fetch the hidden test cases from the problem
        const problem = await Problem.findById(problemId);
        if(!problem){
            res.status(404).send("Problem Not Found");
            return;
        }

        const submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            testCasesPassed:0,
            status:"pending",
            tsetCasesTotal:problem.hiddenTestCases.length
        })

        // Now we can use the code and test cases to run the code

        const languageId = getLanguageById(language);
        const submissions = problem.hiddenTestCases.map((testCase)=>({
                source_code: code,
                language_id: languageId,
                stdin: testCase.input,
                expected_output: testCase.output,
               
        }))
    
        const submitResult = await submitBatch(submissions);

        const resultToken = submitResult.map((value)=>value.token);
        const testResult = await submitToken(resultToken);

        //now we will update the submitted data in the data base 
        let testCasesPassed=0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted';
        let errorMessage =null;

        for(const test of testResult){
            if(test.status_id ==3)
            {
                testCasesPassed++;
                runtime = runtime+parseFloat(test.time);
                memory = Math.max(memory,test.memory);
            }
            else{
               if(test.status_id == 1)
               {
                status = "error";
                errorMessage = test.stderr;
               }
               else{
                status ="Wrong result";
                errorMessage = test.stderr;
               }
            }
        }

        //store the result in the database 
        submittedResult.status = status;
        submittedResult.testCasesPassed=testCasesPassed;
        submittedResult.errorMessage = errorMessage;
        submittedResult.memory =memory;

        await submittedResult.save();
       
        if(!req.result.problemSolved.includes(problemId))
        {
            req.result.problemSolved.push(problemId);
            await req.result.save();
        }
        User.find

        res.status(201).send(submittedResult);
    }
    catch (error) {
        res.status(500).send("Internal Server Error "+error);
    }
}

const runCode = async(req,res)=>{
     try {
        const userId= req.result._id;
        const problemId = req.params.id;
        const{code,language}=req.body;

        if(!userId || !problemId || !code || !language){
            res.status(400).send("All Fields are required");
            return;
        } 

        //fetch the hidden test cases from the problem
        const problem = await Problem.findById(problemId);
        if(!problem){
            res.status(404).send("Problem Not Found");
            return;
        }

        const submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            testCasesPassed:0,
            status:"pending",
            tsetCasesTotal:problem.hiddenTestCases.length
        })

        // Now we can use the code and test cases to run the code

        const languageId = getLanguageById(language);
        const submissions = problem.hiddenTestCases.map((testCase)=>({
                source_code: code,
                language_id: languageId,
                stdin: testCase.input,
                expected_output: testCase.output,
               
        }))
    
        const submitResult = await submitBatch(submissions);

        const resultToken = submitResult.map((value)=>value.token);
        const testResult = await submitToken(resultToken);

        
        //now we will update the submitted data in the data base 
        let testCasesPassed=0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted';
        let errorMessage =null;

        for(const test of testResult){
            if(test.status_id ==3)
            {
                testCasesPassed++;
                runtime = runtime+parseFloat(test.time);
                memory = Math.max(memory,test.memory);
            }
            else{
               if(test.status_id == 1)
               {
                status = "error";
                errorMessage = test.stderr;
               }
               else{
                status ="Wrong result";
                errorMessage = test.stderr;
               }
            }
        }

        //store the result in the database 
        res.status(201).send(testResult);
    }
    catch (error) {
        res.status(500).send("Internal Server Error "+error);
    }
} 

module.exports = {submitCode,runCode};