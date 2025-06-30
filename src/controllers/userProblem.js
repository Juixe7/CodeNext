const Problem = require("../models/problem");
const getLanguageById = require("../utils/problemUtility");
const problemCreator = require("../utils/problemUtility");
const { submitBatch, submitToken } = require("../utils/problemUtility");  
const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution,
    problemCreator,
  } = req.body;

  try {
    //we have to iterate through the startCode and referenceSolution arrays
    for (const { language, completeCode } of referenceSolution) {
      //now we will check if its valid using Judge 0
      //source code
      //language_id
      //std_in
      //expected_output

      //creating a batch submission for all test cases
      const languageId = getLanguageById(language);
      for (const element of visibleTestCases) {
        const submissions = visibleTestCases.map((testCases) => ({
          source_code: completeCode,
          language_id: languageId,
          stdin: testCases.input,
          expected_output: testCases.output,
        }));
      }
      const submitResult = await submitBatch(submissions);

     const resultToken = submitResult.map((value)=>value.token);

     const testResult = await submitToken(resultToken);

     for(const test of testResult){
      if(test.status.id!=3){
        return res.status(400).send("Error Occured");
      }
     }
    }
     // we can store the problem in the database
     await Problem.create({
      ...req.body,
      problemCreator: req.user._id
     })

     res.status(201).send("Problem created successfully!");
  } catch (error) {}
};
