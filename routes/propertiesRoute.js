import express from "express";
import propertiesController from "../controller/propertiesController.js";
import newPropertiesController from "../controller/newPropertiesController.js";
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
  .post(
    "/importProperties",
    upload.single("file"),
    propertiesController.importProperties
  )
  .post("/getPropertiesByIds", propertiesController.getPropertiesByIds)
  .get(
    "/getPropertiesListingCounts",
    propertiesController.getPropertiesListingCounts
  )
  .post("/rejectProperty", propertiesController.rejectProperty)
  .get(
    "/getPropertiesCountsByUserId",
    propertiesController.getPropertiesCountsByUserId
  )
  .get(
    "/getPropertiesListByUserId",
    propertiesController.getPropertiesListByUserId
  )
  .get("/getApprovalProperties", propertiesController.getApprovalProperties)
  .post("/", propertiesController.updatepropertiesByID)
  .get("/", propertiesController.getpropertiesById)
  .post("/", propertiesController.storeproperties)
  .post("/importProperties", upload.single("file"), propertiesController.importProperties)
  .post("/getPropertiesByIds", propertiesController.getPropertiesByIds)
  .get("/getPropertiesListingCounts", propertiesController.getPropertiesListingCounts)
  .post("/rejectProperty", propertiesController.rejectProperty)
  .get("/getPropertiesCountsByUserId", propertiesController.getPropertiesCountsByUserId)
  .get("/getPropertiesListByUserId", propertiesController.getPropertiesListByUserId)
  .get("/getApprovedPropertiesList", propertiesController.getApprovedPropertiesList)
  .post("/changeProperty", upload.single('file'), propertiesController.changeProperty)
  .post("/createUserHistory/:state", propertiesController.createUserHistory)
  .get("/getUserHistory/:state", propertiesController.getUserHistory)
  .get("/getCpUserHistory/:state", propertiesController.getCpUserHistory)
  .get("/getFloorList/:status", propertiesController.getHomeData)



  // new routes
  .post("/v2/createAndUpdateProperty", newPropertiesController.createAndUpdateProperty)
  .get("/v2/getHomeData", newPropertiesController.getHomeData)
  .get("/v2/getSimilarProperties", newPropertiesController.getHomeData)
  .post("/v2/searchPropertiesData", newPropertiesController.searchPropertiesData)
  .get("/v2/list", newPropertiesController.getpropertiesList)
  .post("/v2/adminPropertyList", newPropertiesController.getAdminPropertiesList)
  // .post("/v2/addProperty", newPropertiesController.Edit_Update)
  .post(
    "/v2/editProperty",
    upload.fields([
      { name: "threeSixtyImages" },
      { name: "normalImageFile" },
      { name: "thumbnailFile" },
      { name: "videoFile" },
      { name: "layoutFile" },
      { name: "virtualFile" },
    ]),
    newPropertiesController.uploadProperties
  )
  .delete("/v2/deleteProperty", newPropertiesController.deletepropertiesById)
  .post("/v2/approveProperty", newPropertiesController.approveProperty)
  .get("/v2/filter", newPropertiesController.filterproperties)
  .post("/v2/search", newPropertiesController.searchproperties)
  .post(
    "/v2/addProperty",
    upload.fields([
      { name: "threeSixtyImages" },
      { name: "normalImageFile" },
      { name: "thumbnailFile" },
      { name: "videoFile" },
      { name: "layoutFile" },
      { name: "virtualFile" },
    ]),
    newPropertiesController.uploadProperties
  )
  .post(
    "/v2/importProperties",
    upload.single("file"),
    newPropertiesController.importProperties
  )
  .post("/v2/getPropertiesByIds", newPropertiesController.getPropertiesByIds)
  .get(
    "/v2/getPropertiesListingCounts",
    newPropertiesController.getPropertiesListingCounts
  )
  .post("/v2/rejectProperty", newPropertiesController.rejectProperty)
  .get(
    "/v2/getPropertiesCountsByUserId",
    newPropertiesController.getPropertiesCountsByUserId
  )
  .get(
    "/v2/getPropertiesListByUserId",
    newPropertiesController.getPropertiesListByUserId
  )
  .get("/v2/getApprovalProperties", newPropertiesController.getApprovalProperties)
  .post("/v2/", newPropertiesController.updatepropertiesByID)
  .get("/v2/", newPropertiesController.getpropertiesById)
  .post("/v2/", newPropertiesController.storeproperties)
  .post("/v2/importProperties", upload.single("file"), newPropertiesController.importProperties)
  .post("/v2/getPropertiesByIds", newPropertiesController.getPropertiesByIds)
  .get("/v2/getPropertiesListingCounts", newPropertiesController.getPropertiesListingCounts)
  .post("/v2/rejectProperty", newPropertiesController.rejectProperty)
  .get("/v2/getPropertiesCountsByUserId", newPropertiesController.getPropertiesCountsByUserId)
  .get("/v2/getPropertiesListByUserId", newPropertiesController.getPropertiesListByUserId)
  .get("/v2/getApprovedPropertiesList", newPropertiesController.getApprovedPropertiesList)
  .post("/v2/changeProperty", upload.single('file'), newPropertiesController.changeProperty)
  .post("/v2/createUserHistory/:state", newPropertiesController.createUserHistory)
  .get("/v2/getUserHistory/:state", newPropertiesController.getUserHistory)
  .get("/v2/getCpUserHistory/:state", newPropertiesController.getCpUserHistory)
  .get("/v2/getFloorList/:status", newPropertiesController.getHomeData)
export default router;
