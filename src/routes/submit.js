const express = require("express");
const userMiddleware = require("../middleware/userMiddleware");
const submissionRouter = express.Router();
const { submitCode,runCode } = require("../controllers/userSubmission");

submissionRouter.post("/submit/:id",userMiddleware,submitCode);
submissionRouter.post("/run/:id",userMiddleware,runCode);

module.exports = {submissionRouter};