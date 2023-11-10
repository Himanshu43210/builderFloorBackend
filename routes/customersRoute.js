import express from "express";
import customersController from "../controller/customersController.js";

const router = express.Router();

router
    .post("/signIn", customersController.signinCustomer)
    .post("/addCustomer", customersController.addCustomer)
    .get("/customersList", customersController.getCustomersList)
    .delete("/deleteCustomer", customersController.deleteCustomer);

export default router;