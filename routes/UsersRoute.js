import express from 'express';

const router = express.Router()
import usersController from "../controller/UsersController.js";


router
.post("/", usersController.handleSignup)
.post("/auth/login", usersController.login)
.get("/getUser", usersController.getusersById)
.get("/list", usersController.getusersList)
.get("/children", usersController.getusersChildren)
.get("/filter", usersController.filterUsers)
.post("/", usersController.updateusersByID)
.delete("/deleteUser", usersController.deleteusersById)

export default router
