import express from "express";
import customersController from "../controller/customersController.js";

const router = express.Router();

router
    .post("/signIn", customersController.signinCustomer)
    .post("/addCustomer", customersController.addCustomer);

export default router;