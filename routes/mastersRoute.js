import express from "express";
import mastersController from "../controller/mastersController.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router
  .get("/list", mastersController.getmastersList)
  .get("/getMasterDataOnHome", mastersController.getMasterDataOnHome)
  .post("/addMaster", mastersController.Edit_Update) 
  .post("/editMaster", mastersController.Edit_Update) 
  .delete("/deleteMaster", mastersController.deletemastersById)
  .post("/", mastersController.storemasters)
  .post("/alterMaster", mastersController.updatemastersByID)
  .get("/", mastersController.getmastersById)
  .post("/insertBulkmasters",upload.single('file'), mastersController.insertBulkmasters);

export default router;
