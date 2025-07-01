const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../models/problem");

const createProblem = async (req,res)=>{

    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;


    try{
       
      for(const {language,completeCode} of referenceSolution){
         

        // source_code:
        // language_id:
        // stdin: 
        // expectedOutput:

        const languageId = getLanguageById(language);
          
        // I am creating Batch submission
        const submissions = visibleTestCases.map((testcase)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));


        const submitResult = await submitBatch(submissions);
        // console.log(submitResult);

        const resultToken = submitResult.map((value)=> value.token);

        // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
        
       const testResult = await submitToken(resultToken);

      //  console.log(testResult);

       for(const test of testResult){
        if(test.status_id!=3){
         return res.status(400).send("Error Occured");
        }
       }

      }


      // We can store it in our DB

    const userProblem =  await Problem.create({
        ...req.body,
        problemCreator: req.result._id
      });

      res.status(201).send("Problem Saved Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}


const updateProblem = async (req,res)=>{
  const {id}=req.params;
  const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;

  try {
     if(!id){
        res.status(400).send("Problem ID is required");
        return;
     }
     
  
     const DsaProblem = await Problem.findById(id);
    
     if(!DsaProblem){ 
        res.status(404).send("Problem Not Found");
        return;
        };


     for(const {language,completeCode} of referenceSolution){
         

        // source_code:
        // language_id:
        // stdin: 
        // expectedOutput:

        const languageId = getLanguageById(language);
          
        // I am creating Batch submission
        const submissions = visibleTestCases.map((testcase)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));


        const submitResult = await submitBatch(submissions);
        // console.log(submitResult);

        const resultToken = submitResult.map((value)=> value.token);

        // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
        
       const testResult = await submitToken(resultToken);

      //  console.log(testResult);

       for(const test of testResult){
        if(test.status_id!=3){
         return res.status(400).send("Error Occured");
        }
       }

      }


     const newProblem = Problem.findByIdAndUpdate(id,{...req.body},{runValidators:true,new:true});
     res.status(200).send("Problem Updated Successfully");
    
  } 
  catch (error) {
    res.status(400).send("Error: "+error.message);
  }

}

const deleteProblem = async (req,res)=>{
    const {id} = req.params;
    try {
        if(!id){
            res.status(400).send("Problem ID is required");
            return;
        }   
        
        const DsaProblem = await Problem.findById(id);
        if(!DsaProblem){
            res.status(404).send("Problem Not Found");
            return;
        }

        const deletedProblem = await Problem.findByIdAndDelete(id);
        res.status(200).send("Problem Deleted Successfully");

    } catch (error) {
        res.status(400).send("Error: "+error.message);
    }
}


const getProblemById = async (req,res)=>{
    const {id} = req.params;
    try {
        if(!id){
            res.status(400).send("Problem ID is required");
            return;
        }   
        
        const DsaProblem = await Problem.findById(id).select("-hiddenTestCases -__v -createdAt -updatedAt");
        if(!DsaProblem){
            res.status(404).send("Problem Not Found");
            return;
        }

        res.status(200).send(DsaProblem);

    } catch (error) {
        res.status(400).send("Error: "+error.message);
    }
}   

const getAllProblem = async (req,res)=>{
    try {
        const allProblem = await Problem.find({}).select("title difficulty tags");
        if(!allProblem || allProblem.length==0){
            res.status(404).send("No Problem Found");
            return;
        }

        res.status(200).send(allProblem);
    }
    catch (error) {
        res.status(400).send("Error: "+error.message);
    }
}

// const submissions = [
//     {
//       "language_id": 46,
//       "source_code": "echo hello from Bash",
//       stdin:23,
//       expected_output:43,
//     },
//     {
//       "language_id": 123456789,
//       "source_code": "print(\"hello from Python\")"
//     },
//     {
//       "language_id": 72,
//       "source_code": ""
//     }
//   ]

module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem};