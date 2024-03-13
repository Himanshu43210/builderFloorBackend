import contentController from "../controller/contentController.js";
import express from "express";
const router = express.Router();
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

router.post("/create", upload.single("file"), contentController.create)
    .put("/update", upload.single("file"), contentController.update)
    .get("/findById", contentController.findById)
    .get("/findAll", contentController.findAll)
    .delete("/deleteById", contentController.deleteById)

export default router;