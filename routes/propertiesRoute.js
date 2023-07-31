import express from 'express';
import propertiesController from "../controller/propertiesController.js";

const router = express.Router()

router
  .post("/", propertiesController.storeproperties)
  .get("/", propertiesController.getpropertiesById)
  .get("/list", propertiesController.getpropertiesList)
  .post("/", propertiesController.updatepropertiesByID)
  .delete("/", propertiesController.deletepropertiesById)
 .post("/search", propertiesController.searchproperties)
  .get("/filter", propertiesController.filterproperties)
  .get("/getHomeData", propertiesController.getHomeData)
  .post("/searchPropertiesData", propertiesController.searchPropertiesData)
  .post("/EditUpdate",propertiesController.Edit_Update)

export default router;



