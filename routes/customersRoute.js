import express from "express";
import customersController from "../controller/customersController.js";

const router = express.Router();

router
    .post("/signIn", customersController.signinCustomer)
    .post("/addCustomer", customersController.addCustomer)
    .post("/editCustomer", customersController.editCustomer)
    .get("/customersList", customersController.getCustomersList)
    .delete("/deleteCustomer", customersController.deleteCustomer)
    .post("/reachOut", customersController.reachOut)
    .get("/getReachOutUsers", customersController.getReachOutList)
    .put("/editReachOutUserStatus", customersController.editReachOutUserStatus);

export default router;