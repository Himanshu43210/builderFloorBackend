import express from "express";

const router = express.Router();
import usersController from "../controller/UsersController.js";

router
  .post("/auth/login", usersController.login)
  .get("/list", usersController.getusersList)
  .get("/adminUserList", usersController.getAdminUsersList)
  .post("/addUser", usersController.updateEditUsers)
  .post("/editUser", usersController.updateEditUsers)
  .delete("/deleteUser", usersController.deleteusersById)
  .get("/children", usersController.getusersChildren)
  .get("/filter", usersController.filterUsers)
  .post("/EditUpdate", usersController.Edit_update)
  .get("/getUser", usersController.getusersById)
  .post("/", usersController.handleSignup)
  .get("/channelPartnersList", usersController.getChannelPartnersList)
  .post("/addUserLocation", usersController.addUserLocation)
  .put("/updateUserStatus", usersController.updateUserStatus)
  .post("/sendOTP", usersController.sendOTP)
  .post("/addUserFilters", usersController.addUserFilters)
  .post("/verifyEmailOtp", usersController.verifyEmailOtp);

export default router;
