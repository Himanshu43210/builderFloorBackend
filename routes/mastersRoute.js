import express from "express";
import mastersController from "../controller/mastersController.js";

const router = express.Router();

router
  .get("/", mastersController.getmastersById)
  .get("/list", mastersController.getmastersList)
  .post("/", mastersController.updatemastersByID)
  .delete("/", mastersController.deletemastersById)
  .post("/EditUpdate", mastersController.Edit_Update)
  .post("/", mastersController.storemasters);

export default router;
