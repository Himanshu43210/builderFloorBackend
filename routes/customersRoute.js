import express from "express";
import customersController from "../controller/customersController";

const router = express.Router();

router
    .post("/addCustomer", customersController.updateAddCustomer);

export default router;