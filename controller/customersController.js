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
        const { fullName, phoneNumber, email, role = "customer" } = req.body;
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
                role,
                email
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

const searchCustomerData = async (search) => {
    const regex = new RegExp(search, 'i');
    const fieldsToSearch = [
      'fullName',
      'email',
      'phoneNumber',
      'role',
      'status',
    ];
    return fieldsToSearch.map((field) => ({ [field]: regex }));
  }

const getCustomersList = async (req, res) => {
    try {
        const id = req.query.id || "";
        let page = Number(req.query.page) || 0;
        const limit = Number(req.query.limit) < 10 ? 10 : Number(req.query.limit);

        let skip = (page) * limit;

        const query = {};
        if (req.query.search) {
            query["$or"] = await searchCustomerData(req.query.search)
        }
        let data = await customers.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit);

        const totalDocuments = await customers.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit);

        res.status(200).json({
            data: data,
            nbHits: data.length,
            pageNumber: page,
            totalPages: totalPages,
            totalItems: totalDocuments,
        });
    } catch (error) {
        res.status(400).json({ messgae: "An error Occoured", error });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const id = req.query.id;
        const deletedCustomer = await customers.findByIdAndRemove(id);
        if (!deletedCustomer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }
        res.status(200).json({ message: "Customer deleted", deletedCustomer });
    } catch (error) {
        res.status(400).json({ messgae: "An error Occoured", error });
    }
};

export default {
    updateAddCustomer,
    addCustomer,
    signinCustomer,
    getCustomersList,
    deleteCustomer,
};