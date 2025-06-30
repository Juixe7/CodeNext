
const {
  createProblem,// yes
  getAllProblems,//no
  getProblemById,//no
  updateProblem,//no
  deleteProblem,//no
  solvedAllproblembyUser,//no
} = require("../controllers/userProblem");
//
//create
//fetch
//update
//delete
const express=require('express');//to create a router
const { get } = require('http');
const problemRouter=express.Router();
const adminMiddleware=require("../middleware/adminMiddleware");

problemRouter.post("/create",adminMiddleware,createProblem);

problemRouter.patch("/:id",updateProblem);

problemRouter.delete("/:id",deleteProblem);

//.............................................................
problemRouter.get("/",getAllProblems);

problemRouter.get("/user",solvedAllproblembyUser);

problemRouter.get("/:id",getProblemById);