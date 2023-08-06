import express from "express";
import mastersController from "../controller/mastersController.js";

const router = express.Router();

router
  .get("/list", mastersController.getmastersList)
  .post("/addMaster", mastersController.Edit_Update) 
  .post("/editMaster", mastersController.Edit_Update) 
  .delete("/deleteMaster", mastersController.deletemastersById)
  .post("/", mastersController.storemasters)
  .post("/alterMaster", mastersController.updatemastersByID)
  .get("/", mastersController.getmastersById);

export default router;
