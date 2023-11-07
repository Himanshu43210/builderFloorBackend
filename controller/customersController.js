import customers from "../models/customerModel.js";

const signinCustomer = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number required.' });
        }
        let data = await customers.findOne({ phoneNumber: phoneNumber });
        if (data) {
            return res.json({
                success: true,
                message: "Sign in successful.",
                user: data
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "No such user exist"
            });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ messgae: "An error Occoured", error });
    }
};

const addCustomer = async (req, res) => {
    try {
        const { fullName, phoneNumber, role = "customer" } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number required.' });
        }
        let data = await customers.findOne({ phoneNumber: phoneNumber });
        if (data) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        } else {
            if (!fullName) {
                return res.status(400).json({ message: 'Full name required.' });
            }
            const customerToSave = {
                fullName,
                phoneNumber,
                role
            };
            const newCustomer = new customers(customerToSave);
            await newCustomer.save();
            res.json({
                success: true,
                message: "New User Stored.",
                data: newCustomer
            });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ messgae: "An error Occoured", error });
    }
};

const updateAddCustomer = async (req, res) => {
    try {
        const { fullName, phoneNumber, role = "customer" } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number required.' });
        }

        let data = await customers.findOne({ phoneNumber: phoneNumber });

        if (data) {
            return res.send({
                success: true,
                message: "User already exists",
                user: data
            });
        } else {
            if (!fullName) {
                return res.status(400).json({ message: 'Full name required.' });
            }
            const customerToSave = {
                fullName,
                phoneNumber,
                role
            };
            const newCustomer = new customers(customerToSave);
            await newCustomer.save();
            res.send({
                success: true,
                message: "New User Stored.",
                data: newCustomer
            });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ messgae: "An error Occoured", error });
    }
};

export default {
    updateAddCustomer,
    addCustomer,
    signinCustomer
};