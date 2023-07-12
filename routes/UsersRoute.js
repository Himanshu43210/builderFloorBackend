import express from 'express';

const router = express.Router()
import usersController from "../controller/UsersController.js";
import uploader from "../middleware/uploader.js";

router
.post("/", usersController.handleSignup)
.post("/auth/login", usersController.login)
.get("/getUser", usersController.getusersById)
.get("/list", usersController.getusersList)
.get("/children", usersController.getusersChildren)
.put("/", usersController.updateusersByID)
.delete("/deleteUser", usersController.deleteusersById)

export default router
