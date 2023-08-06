import express from "express";

const router = express.Router();
import usersController from "../controller/UsersController.js";

router
  .post("/auth/login", usersController.login)
  .get("/list", usersController.getusersList)
  .post("/addUser", usersController.updateEditUsers)
  .post("/editUser", usersController.updateEditUsers)
  .delete("/deleteUser", usersController.deleteusersById)
  .get("/children", usersController.getusersChildren)
  .get("/filter", usersController.filterUsers)
  .post("/EditUpdate", usersController.Edit_update)
  .get("/getUser", usersController.getusersById)
  .post("/", usersController.handleSignup);

export default router;
