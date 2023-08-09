import express from "express";
import propertiesController from "../controller/propertiesController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router
  .get("/getHomeData", propertiesController.getHomeData)
  .get("/getSimilarProperties", propertiesController.getHomeData)
  .post("/searchPropertiesData", propertiesController.searchPropertiesData)
  .get("/list", propertiesController.getpropertiesList)
  // .post("/addProperty", propertiesController.Edit_Update)
  .post(
    "/editProperty",
    upload.array("files"),
    propertiesController.uploadProperties
  )
  .delete("/deleteProperty", propertiesController.deletepropertiesById)
  .post("/approveProperty", propertiesController.approveProperty)
  .get("/filter", propertiesController.filterproperties)
  .post("/search", propertiesController.searchproperties)
  .post(
    "/addProperty",
    upload.array("files"),
    propertiesController.uploadProperties
  )
  .post("/", propertiesController.updatepropertiesByID)
  .get("/", propertiesController.getpropertiesById)
  .post("/", propertiesController.storeproperties);

export default router;
