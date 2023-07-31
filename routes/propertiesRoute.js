import express from 'express';
import propertiesController from "../controller/propertiesController.js";

const router = express.Router()

router
  .post("/", propertiesController.storeproperties)
  .get("/", propertiesController.getpropertiesById)
  .get("/list", propertiesController.getpropertiesList)
  .put("/", propertiesController.updatepropertiesByID)
  .delete("/", propertiesController.deletepropertiesById)
 .post("/search", propertiesController.searchproperties)
  .get("/filter", propertiesController.filterproperties)

export default router;



