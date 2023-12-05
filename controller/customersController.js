import users from "../models/UsersModel.js";
import customers from "../models/customerModel.js";
import reachOutUser from "../models/reachoutModel.js";
import userHistory from "../models/userHistoryModel.js";
import transporter from "../utils/mail-transporter.js";

const signinCustomer = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number required.' });
        }
        let data = await customers.findOne({ phoneNumber: phoneNumber });
        const user = await users.findOne({ phoneNumber: phoneNumber });
        const agent = user ? true : false;
        if (data) {
            return res.json({
                success: true,
                message: "Sign in successful.",
                user: data,
                agent
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

const editCustomer = async (req, res) => {
    try {
        const { _id, fullName, phoneNumber, email, status } = req.body;
        let data = await customers.findOne({ phoneNumber: phoneNumber });
        if (data) {
            const dataToSave = {
                fullName: fullName,
                phoneNumber: phoneNumber,
                email: email,
                status: status
            };
            const updatedData = await customers.findByIdAndUpdate(_id, {
                $set: dataToSave,
            }, { new: true });
            await transporter.sendMail({
                from: "propertyp247@gmail.com",
                to: [updatedData.email || "", "dpundir72@gmail.com"],
                subject: "BuilderFloor account updated",
                html: `
                      <div
                        style="max-width: 90%; margin: auto; padding-top: 20px;"
                      >
                        <br/>
                        <span style="font-weight:800; display:block;">Your customer account has been updated on <a href="https://builderfloor.com">builderfloor.com</a>.</span>
                        <br />
                        <span style="font-weight:800; display:block;">Use below credentials to sign in.</span>
                        <br />
                        <span style="font-weight:800; display:block;">Email Id: ${updatedData.email}</span>
                        <br />
                        <span style="font-weight:800; display:block;">Password: ${updatedData.password}</span>
                      </div>
                    `,
            });
            return res.status(200).json({ messgae: "customer updated" });
        } else {
            res.status(400).json({ messgae: "No such customer exists", error });
        }
    } catch (error) {
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

const searchReachOutUserData = async (search) => {
    const regex = new RegExp(search, 'i');
    const fieldsToSearch = [
        'phoneNumber',
        'contacted',
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
        const deletedHistory = await userHistory.deleteMany({ userId: id });
        res.status(200).json({ message: "Customer deleted", deletedCustomer, deletedHistory });
    } catch (error) {
        res.status(400).json({ messgae: "An error Occoured", error });
    }
};

const deleteReachOutUser = async (req, res) => {
    try {
        const id = req.query.id;
        const deletedUser = await reachOutUser.findByIdAndRemove(id);
        if (!deletedUser) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }
        res.status(200).json({ success: true, message: "User deleted", data: deletedUser });
    } catch (error) {
        res.status(400).json({ messgae: "An error Occoured", error });
    }
};

const reachOut = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number required.' });
        }
        const newUser = new reachOutUser({
            phoneNumber: phoneNumber,
            contacted: "No"
        });
        await newUser.save();
        const adminEmail = 'admin@builderfloor.com';
        await transporter.sendMail({
            from: "propertyp247@gmail.com",
            to: [adminEmail || "", "tanish@techhelps.co.in"],
            subject: "Customer Reach Out",
            html: `
                  <div
                    style="max-width: 90%; margin: auto; padding-top: 20px;"
                  >
                    <br/>
                    <span style="font-weight:800; display:block;">Someone with contact number ${newUser?.phoneNumber || phoneNumber} has requested to reach out on <a href="https://builderfloor.com">builderfloor.com</a>.</span>
                  </div>
                `,
        });
        return res.status(200).json({
            success: true,
            data: newUser,
            messgae: "data to reach out to has been saved"
        });
    } catch (error) {
        res.status(400).json({ messgae: "An error Occoured", error });
    }
};

const getReachOutList = async (req, res) => {
    try {
        let page = Number(req.query.page) || 0;
        const limit = Number(req.query.limit) < 10 ? 10 : Number(req.query.limit);

        let skip = (page) * limit;

        const query = {};
        if (req.query.search) {
            query["$or"] = await searchReachOutUserData(req.query.search)
        }
        const data = await reachOutUser.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit);

        const totalDocuments = await reachOutUser.countDocuments(query);
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

const editReachOutUserStatus = async (req, res) => {
    try {
        const { contacted, phoneNumber } = req.body;
        if (!phoneNumber) {
            res.status(400).json({
                success: false,
                message: "Phone number required"
            });
        }
        const user = await reachOutUser.findOne({ phoneNumber: phoneNumber });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "Phone number does not exist"
            });
        }
        const updatedUser = await reachOutUser.findByIdAndUpdate(user._id, {
            $set: { contacted: contacted },
        }, { new: true });
        return res.status(200).json({
            success: true,
            data: updatedUser,
            messgae: "Status updated"
        });
    } catch (error) {
        res.status(400).json({ messgae: "An error Occoured", error });
    }
};

const getNotContactedUserCounts = async (req, res) => {
    try {
        const totalDocuments = await reachOutUser.countDocuments({ contacted: "No" });
        const data = [
            { label: "Customers to Reach Out", value: totalDocuments },
        ];
        return res.status(200).json({ response: data });
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
    editCustomer,
    reachOut,
    getReachOutList,
    editReachOutUserStatus,
    deleteReachOutUser,
    getNotContactedUserCounts
};