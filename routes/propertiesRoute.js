import express from "express";
import propertiesController from "../controller/propertiesController.js";
import multer from "multer";

const router = express.Router();
// const upload = multer({ dest: "uploads/" });
const upload = multer({ storage: multer.memoryStorage() });

router
  .get("/getHomeData", propertiesController.getHomeData)
  .get("/getSimilarProperties", propertiesController.getHomeData)
  .post("/searchPropertiesData", propertiesController.searchPropertiesData)
  .get("/list", propertiesController.getpropertiesList)
  .post("/adminPropertyList", propertiesController.getAdminPropertiesList)
  // .post("/addProperty", propertiesController.Edit_Update)
  .post(
    "/editProperty",
    upload.fields([
      { name: "threeSixtyImages" },
      { name: "normalImageFile" },
      { name: "thumbnailFile" },
      { name: "videoFile" },
      { name: "layoutFile" },
      { name: "virtualFile" },
    ]),
    propertiesController.uploadProperties
  )
  .delete("/deleteProperty", propertiesController.deletepropertiesById)
  .post("/approveProperty", propertiesController.approveProperty)
  .get("/filter", propertiesController.filterproperties)
  .post("/search", propertiesController.searchproperties)
  .post(
    "/addProperty",
    upload.fields([
      { name: "threeSixtyImages" },
      { name: "normalImageFile" },
      { name: "thumbnailFile" },
      { name: "videoFile" },
      { name: "layoutFile" },
      { name: "virtualFile" },
    ]),
    propertiesController.uploadProperties
  )
  .post("/", propertiesController.updatepropertiesByID)
  .get("/", propertiesController.getpropertiesById)
  .post("/", propertiesController.storeproperties)
  .post("/importProperties", upload.single("file"), propertiesController.importProperties)
  .post("/getPropertiesByIds", propertiesController.getPropertiesByIds)
  .get("/getPropertiesListingCounts", propertiesController.getPropertiesListingCounts)
  .post("/rejectProperty", propertiesController.rejectProperty)
  .get("/getPropertiesCountsByUserId", propertiesController.getPropertiesCountsByUserId)
  .get("/getPropertiesListByUserId", propertiesController.getPropertiesListByUserId);

export default router;
