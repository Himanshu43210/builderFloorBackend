import express from 'express';
import mastersController from "../controller/mastersController.js";
import uploader from "../middleware/uploader.js";
const router = express.Router()

router
  .post("/", mastersController.storemasters)
  .get("/", mastersController.getmastersById)
  .get("/list", mastersController.getmastersList)
  .put("/", mastersController.updatemastersByID)
  .delete("/", mastersController.deletemastersById)
 
export default router;



