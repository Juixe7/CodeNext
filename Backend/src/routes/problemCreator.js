const express = require('express');

const problemRouter =  express.Router();
const adminMiddleware = require("../middleware/adminMiddleware")
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser} = require("../controllers/userProblem");
const userMiddleware = require("../middleware/userMiddleware");


// Create
 problemRouter.post("/create",adminMiddleware ,createProblem);
 problemRouter.patch("/update/:id",adminMiddleware,updateProblem);
 problemRouter.delete("/:id",adminMiddleware,deleteProblem);

 problemRouter.get("/getAllProblem",userMiddleware, getAllProblem);


 problemRouter.get("/problemSolvedByUser",userMiddleware, solvedAllProblembyUser);
problemRouter.get("/:id",userMiddleware,getProblemById);


module.exports = problemRouter;

// fetch
// update
// delete 
