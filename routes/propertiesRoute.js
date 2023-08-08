import express from "express";
import propertiesController from "../controller/propertiesController.js";

const router = express.Router();

router
  .get("/getHomeData", propertiesController.getHomeData)
  .get("/getSimilarProperties", propertiesController.getHomeData)
  .post("/searchPropertiesData", propertiesController.searchPropertiesData)
  .get("/list", propertiesController.getpropertiesList)
  .post("/addProperty", propertiesController.Edit_Update)
  .post("/editProperty", propertiesController.Edit_Update)
  .delete("/deleteProperty", propertiesController.deletepropertiesById)
  .post("/approveProperty", propertiesController.approveProperty)
  .get("/filter", propertiesController.filterproperties)
  .post("/search", propertiesController.searchproperties)
  .post("/", propertiesController.updatepropertiesByID)
  .get("/", propertiesController.getpropertiesById)
  .post("/", propertiesController.storeproperties);

export default router;
