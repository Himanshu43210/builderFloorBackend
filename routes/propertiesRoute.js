import express from 'express';
import propertiesController from "../controller/propertiesController.js";
import uploader from "../middleware/uploader.js";
const router = express.Router()

router
  .post("/", propertiesController.storeproperties)
  .get("/", propertiesController.getpropertiesById)
  .get("/list", propertiesController.getpropertiesList)
  .put("/", propertiesController.updatepropertiesByID)
  .delete("/", propertiesController.deletepropertiesById)

export default router;



