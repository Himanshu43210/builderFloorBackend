import customers from "../models/customerModel";

const updateAddCustomer = async (req, res, next) => {
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
};