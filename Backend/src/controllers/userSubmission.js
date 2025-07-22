const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const { updateStreak } = require('./userFeatures');

const submitCode = async (req,res)=>{
   
    // 
    try{
      
       const userId = req.result._id;
       const problemId = req.params.id;

       let {code,language} = req.body;

      if(!userId||!code||!problemId||!language)
        return res.status(400).send("Some field missing");
      

      if(language==='cpp')
        language='c++'
      
      console.log(language);
      
    //    Fetch the problem from database
       const problem =  await Problem.findById(problemId);
    //    testcases(Hidden)
    
    //   Kya apne submission store kar du pehle....
    const submittedResult = await Submission.create({
          userId,
          problemId,
          code,
          language,
          status:'pending',
          testCasesTotal:problem.hiddenTestCases.length
     })

    //    Judge0 code ko submit karna hai
    
    const languageId = getLanguageById(language);
   
    // Stitch user code and driver code together
    let finalCode = code;
    if (problem.driverCode && problem.driverCode.length > 0) {
        const driver = problem.driverCode.find(d => d.language === language || d.language.toLowerCase() === language.toLowerCase());
        if (driver && driver.code) {
            finalCode = code + "\n\n" + driver.code;
        }
    }

    const submissions = problem.hiddenTestCases.map((testcase)=>({
        source_code: finalCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));

    
    const submitResult = await submitBatch(submissions);
    
    const resultToken = submitResult.map((value)=> value.token);

    const testResult = await submitToken(resultToken);
    

    // submittedResult ko update karo
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'accepted';
    let errorMessage = null;


    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = 'error'
            errorMessage = test.stderr
          }
          else{
            status = 'wrong'
            errorMessage = test.stderr
          }
        }
    }


    // Store the result in Database in Submission
    submittedResult.status   = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();
    
    // ProblemId ko insert karenge userSchema ke problemSolved mein if it is not persent there.
    
    // req.result == user Information

    if(status === 'accepted'){
      if(!req.result.problemSolved.includes(problemId)){
        req.result.problemSolved.push(problemId);
        await req.result.save();
      }
      // Update daily streak
      await updateStreak(req.result._id);

      // --- DSA Battle Hook ---
      const Match = require('../models/match');
      const User = require('../models/user');
      const { getIo } = require('../config/socket');

      const activeMatch = await Match.findOne({
        players: req.result._id,
        status: 'ongoing'
      });

      if (activeMatch) {
        activeMatch.winner = req.result._id;
        activeMatch.status = 'finished';
        await activeMatch.save();

        // Update User Elo
        const p1 = await User.findById(activeMatch.players[0]);
        const p2 = await User.findById(activeMatch.players[1]);
        
        const winner = p1._id.equals(req.result._id) ? p1 : p2;
        const loser = p1._id.equals(req.result._id) ? p2 : p1;

        winner.eloRating += 25;
        winner.battleWins += 1;
        loser.eloRating = Math.max(0, loser.eloRating - 15);
        loser.battleLosses += 1;

        await winner.save();
        await loser.save();

        const io = getIo();
        if (io) {
          io.to(activeMatch._id.toString()).emit('match_won', {
            winner: req.result.firstName,
            winnerId: req.result._id
          });
        }
      }
      // ------------------------
    }
    
    const accepted = (status == 'accepted')
    res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory,
      error: errorMessage
    });
       
    }
    catch(err){
      res.status(500).send("Internal Server Error "+ err);
    }
}


const runCode = async(req,res)=>{
    
     // 
     try{
      const userId = req.result._id;
      const problemId = req.params.id;

      let {code,language} = req.body;

     if(!userId||!code||!problemId||!language)
       return res.status(400).send("Some field missing");

   //    Fetch the problem from database
      const problem =  await Problem.findById(problemId);
   //    testcases(Hidden)
      if(language==='cpp')
        language='c++'

   //    Judge0 code ko submit karna hai

   const languageId = getLanguageById(language);

   // Stitch user code and driver code together
   let finalCode = code;
   if (problem.driverCode && problem.driverCode.length > 0) {
       const driver = problem.driverCode.find(d => d.language === language || d.language.toLowerCase() === language.toLowerCase());
       if (driver && driver.code) {
           finalCode = code + "\n\n" + driver.code;
       }
   }

   const submissions = problem.visibleTestCases.map((testcase)=>({
       source_code: finalCode,
       language_id: languageId,
       stdin: testcase.input,
       expected_output: testcase.output
   }));


   const submitResult = await submitBatch(submissions);
   
   const resultToken = submitResult.map((value)=> value.token);

   const testResult = await submitToken(resultToken);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = true;
    let errorMessage = null;

    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = false
            errorMessage = test.stderr
          }
          else{
            status = false
            errorMessage = test.stderr
          }
        }
    }

   
  
   res.status(201).json({
    success:status,
    testCases: testResult,
    runtime,
    memory
   });
      
   }
   catch(err){
     res.status(500).send("Internal Server Error "+ err);
   }
}


module.exports = {submitCode,runCode};



//     language_id: 54,
//     stdin: '2 3',
//     expected_output: '5',
//     stdout: '5',
//     status_id: 3,
//     created_at: '2025-05-12T16:47:37.239Z',
//     finished_at: '2025-05-12T16:47:37.695Z',
//     time: '0.002',
//     memory: 904,
//     stderr: null,
//     token: '611405fa-4f31-44a6-99c8-6f407bc14e73',


// User.findByIdUpdate({
// })

//const user =  User.findById(id)
// user.firstName = "Mohit";
// await user.save();