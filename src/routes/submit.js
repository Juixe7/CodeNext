const express = require("express");
const userMiddleware = require("../middleware/userMiddleware");
const submissionRouter = express.Router();
const { submitCode } = require("../controllers/userSubmission");

submissionRouter.post("/submit/:id",userMiddleware,submitCode);