import users from "../models/UsersModel.js";
import properties from "../models/propertiesModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import otpModel from "../models/otpModel.js";
import otpGenerator from "otp-generator";
import transporter from "../utils/mail-transporter.js";
import userHistory from "../models/userHistoryModel.js";

import { BUILDER_FLOOR_ADMIN, CHANNEL_PARTNER, SALES_USER } from "../const.js";
import crypto from "crypto";
import { tryEach } from "async";
import customers from "../models/customerModel.js";
import notifications from "../models/notificationsModel.js";
import randomstring from "randomstring";

const filePath = "./data.json";
const JWT_SECERET = "techHelps";
const salt = await bcrypt.genSalt();

export const USER_ROLE = {
  [BUILDER_FLOOR_ADMIN]: "BuilderFloorAdmin",
  [CHANNEL_PARTNER]: "ChannelPartner",
  [SALES_USER]: "PropertyDealer",
};

const Edit_update = async (req, res) => {
  const { _id, password, ...data } = req.body;

  try {
    if (_id) {
      // If _id is present, update the existing user
      const existingUser = await users.findById(_id);

      if (!existingUser) {
        return res.status(404).json({ error: "User not found." });
      }

      // Check if the password is provided for update
      if (password) {
        // Hash the provided password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUser.password = password;
      }

      // Update other user data
      existingUser.set(data);

      // Save the updated user to the database
      await existingUser.save();
      return res.json(existingUser);
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new users({ ...data, password: password });

      await newUser.save();

      return res.json(newUser);
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to save the user." });
  }
};

const getusersList = async (req, res, next) => {
  try {
    let page = Number(req.query.page) || 0;
    console.log("it is here");
    const limit = Number(req.query.limit) < 10 ? 10 : Number(req.query.limit);
    let skip = (page) * limit;
    const query = {};
    if (req.query.search) {
      query["$or"] = await serchUserData(req.query.search)
    }
    let data = await users.find(query).skip(skip).limit(limit);

    const totalDocuments = await users.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      data,
      nbHits: data.length,
      pageNumber: page,
      totalPages: totalPages,
      totalItems: totalDocuments,
    });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const getAdminUsersList = async (req, res, next) => {
  try {
    const id = req.query.id || "";
    console.log(id);
    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) < 10 ? 10 : Number(req.query.limit);

    let skip = (page) * limit;
    const query = { parentId: id, cpRequest: { $ne: "requested" } };
    if (req.query.search) {
      query["$or"] = await serchUserData(req.query.search)
    }
    let data = await users.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit);

    const totalDocuments = await users.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      data,
      nbHits: data.length,
      pageNumber: page,
      totalPages: totalPages,
      totalItems: totalDocuments,
    });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const getAdminUserDataById = async (req, res) => {
  try {
    const id = req.query.id || "";
    const data = await users.find({ _id: id });
    res.status(200).json({ data });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const filterUsers = async (req, res, next) => {
  try {
    const filter = req.query.filter;

    const filteredUsers = await users.find();

    if (filter.email && filter.email.length > 0) {
      filteredUsers = filteredUsers.filter((users) =>
        filter.email.includes(users.email)
      );
    }

    if (filter.phoneNumber && filter.phoneNumber.length > 0) {
      filteredUsers = filteredUsers.filter((users) =>
        filter.phoneNumber.includes(users.phoneNumber)
      );
    }

    if (filter.name && filter.name.length > 0) {
      filteredUsers = filteredUsers.filter((users) =>
        filter.name.includes(users.name)
      );
    }
    res.status(200).json({ filteredUsers });
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" });
  }
};

const updateEditUsers = async (req, res, next) => {
  try {
    let id = req.body._id;
    const hashedPassword = await bcrypt.hash(req.body.password || "123", 10);
    const dataToSave = {
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      // address: req.body.address,
      companyName: req.body.companyName,
      companyAddress: req.body.companyAddress,
      state: req.body.state,
      city: req.body.city,
      role: req.body.role,
      location: req.body.location,
      status: req.body.type == 'agent' ? "inactive" : req.body.status,
      parentId:
        req.body.role === USER_ROLE[BUILDER_FLOOR_ADMIN]
          ? "Approved"
          : req.body.parentId, // password: hashedPassword,
      password: req.body.password || "123",
      pid: req.body.parentId,
      cpRequest: req.body.type == 'agent' ? 'requested' : 'approved'
    };
    let data = await users.findOne({ _id: req.body._id });

    if (data) {
      const updatedData = await users.findByIdAndUpdate(id, {
        $set: dataToSave,
      }, { new: true });
      await transporter.sendMail({
        from: "propertyp247@gmail.com",
        to: [updatedData.email, "tanish@techhelps.co.in"],
        subject: "BuilderFloor account updated",
        html: `
              <div
                style="max-width: 90%; margin: auto; padding-top: 20px;"
              >
                <br/>
                <span style="font-weight:800; display:block;">Your account has been updated on <a href="https://builderfloor.com">builderfloor.com</a>.</span>
                <br />
                <span style="font-weight:800; display:block;">Use below credentials to sign in.</span>
                <br />
                <span style="font-weight:800; display:block;">Email Id: ${updatedData.email}</span>
                <br />
                <span style="font-weight:800; display:block;">Password: ${updatedData.password}</span>
              </div>
            `,
      });
      return res.status(200).json({ messgae: "users updated" });
    }

    const { name, email, phoneNumber, companyName, companyAddress, parentId, state, city,password } = req.body;
    if (!name || !email || !phoneNumber || !companyName || !companyAddress || !parentId || !state || !city || !password) {
      return res.status(403).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // const bytes = crypto.randomBytes(12 / 2);
    // const pass = bytes.toString('hex');
    // dataToSave.password = pass;
    await transporter.sendMail({
      from: "propertyp247@gmail.com",
      to: [email, "dpundir72@gmail.com"],
      subject: "Builder floor signup Email",
      html: `
            <div
              style="max-width: 90%; margin: auto; padding-top: 20px;"
            >
              <br/>
              <span style="font-weight:800; display:block;">${password} is your password for builderfloor.com .</span>
            </div>
          `,
    });
    const newUser = new users(dataToSave);
    let customer, newCustomer;
    await newUser.save();
    if (req.body.type == 'agent') {
      customer = await customers.findOne({ phoneNumber: phoneNumber });
      if (!customer) {
        newCustomer = new customers({ fullName: name, phoneNumber, email });
        await newCustomer.save();
      }
    }
    if (newUser && req.body.type == 'agent') {
      // send notification email to admin
      const adminEmail = 'admin@builderfloor.com';
      await transporter.sendMail({
        from: "propertyp247@gmail.com",
        to: [adminEmail, "tanish@techhelps.co.in"],
        subject: "BuilderFloor Broker Registration",
        html: `
              <div
                style="max-width: 90%; margin: auto; padding-top: 20px;"
              >
                <br/>
                <span style="font-weight:800; display:block;">A new broker, ${newUser?.name}(${newUser?.email || newUser?.phoneNumber}), has requested for an account on builderfloor.com.</span>
              </div>
            `,
      });
    }
    res.send({ message: `New Users${(!customer && newCustomer) ? " and Customer" : ""} Stored.` });
  } catch (error) {
    console.log(error);
    res.status(400).json({ messgae: "An error Occoured", error });
  }
};

const getusersById = async (req, res, next) => {
  try {
    let id = req.query.id;
    let data = await users.findById(id);
    res.status(200).json({ data });
  } catch (err) {
    res.status(400).json({ messgae: err.message });
  }
};

const login = async (req, res) => {
  try {
    let success = false;
    const { email, password } = req.body;
    let user = await users.findOne({ email, password });
    if (!user) {
      return res.status(400).json({
        error: "Please try to login with correct credentials",
      });
    }

    if (user.cpRequest && user.cpRequest == "requested") {
      return res.status(400).json({
        error: "Channel partner not approved",
      });
    }

    const data = {
      user: {
        id: user.id,
      },
    };

    let _id = user?._id;
    if (user?.role == "SalesUser") {
      _id = user?.parentId || user?._id;
    }
    const authToken = jwt.sign(data, JWT_SECERET);
    const parentUser = await users.findOne({ _id });
    // res.json(user);
    const profile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      parentId: user.parentId,
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      state: user.state,
      city: user.city,
      location: user.location,
    };
    return res.json({ authToken, profile, parentUser });
  } catch (err) {
    res.status(400).json({ messgae: err.message });
  }
};

const deleteusersById = async (req, res, next) => {
  try {
    const id = req.query.id;
    const deletedUser = await users.findByIdAndRemove(id);
    if (!deletedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const deletedProperties = await properties.deleteMany({ parentId: id });
    res.status(200).json({ message: "User deleted", deletedUser, deletedProperties });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const handleSignup = async (req, res) => {
  try {

    const { name, email, password, phoneNumber, role, otp, companyName, companyAddress, parentId } = req.body;
    if (!name || !email || !password || !phoneNumber || !role || !otp || !companyName || !companyAddress || !parentId) {
      return res.status(403).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // const response = await otpModel.find({ email }).sort({ createdAt: -1 }).limit(1);
    // if (response.length === 0 || otp !== response[0].otp) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'The OTP is not valid',
    //   });
    // }

    // Create a new user in the database
    const hashedPassword = await bcrypt.hash(req.body.password || "123", 10);
    const newUser = new users({
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      companyAddress: req.body.companyAddress,
      companyName: req.body.companyName,
      role: req.body.role,
      parentId: req.body.parentId,
      password: req.body.password,
    });
    await newUser.save();
    // Create a new user in the databas
    res.send({ message: "Sign Up succesfully." });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "error occured" });
  }
};

const handleVerifyOTP = async (req, res) => {
  try {
    const user = await users.findOne({ email: req.session.email });

    if (!user) {
      return res.status(401).send({ message: "User not found." });
    }

    if (req.body.otp === req.session.otp) {
      delete req.session.otp;
      delete req.session.email;

      user.isVerified = true;
      await user.save();

      const token = jwt.sign({ userId: user._id }, JWT_SECERET);

      res.send({ token });
    } else {
      res.status(401).send({ message: "Invalid OTP." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error verifying OTP." });
  }
};

const getusersChildren = async (req, res, next) => {
  try {
    const userId = req.query.id;
    const users = await Users.find({ Parentid: userId });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

const getChannelPartnersList = async (req, res, next) => {
  try {
    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) < 10 ? 10 : Number(req.query.limit);
    let skip = (page) * limit;
    let query = { role: "ChannelPartner" }
    if (req.query.search) {
      query["$or"] = await serchUserData(req.query.search)
    }
    let data = await users
      .find(query)
      .skip(skip)
      .limit(limit);

    const totalDocuments = await users.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      data,
      nbHits: data.length,
      pageNumber: page,
      totalPages: totalPages,
      totalItems: totalDocuments,
    });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const addUserLocation = async (req, res, next) => {
  try {
    await users.findByIdAndUpdate(
      { _id: req.body.id },
      { location: req.body.location }
    );
    return res
      .status(200)
      .json({ message: "User location added successfully." });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    await users.findByIdAndUpdate(
      { _id: req.body.id },
      { status: req.body.status }
    );
    return res
      .status(200)
      .json({ message: "User status updated successfully." });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(403).json({
        success: false,
        message: 'Email is required',
      });
    }
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    await new otpModel({ email, otp }).save();

    let info = await transporter.sendMail({
      from: "propertyp247@gmail.com",
      to: [email, "dpundir72@gmail.com"],
      subject: "Verification Email",
      html: `
            <div
              style="max-width: 90%; margin: auto; padding-top: 20px;"
            >
              <br/>
              <span style="font-weight:800; display:block;">${otp} is your verification code for builderfloor.com .</span>
            </div>
          `,
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const addUserFilters = async (req, res) => {
  try {
    const { masterFilter, userId } = req.body;
    const user = await users.findOne({ _id: userId }).select('_id');
    if (!user) {
      return res.status(400).json({ success: false, message: "User does not exist." });
    }
    const data = await users.findByIdAndUpdate({ _id: userId }, { filters: masterFilter });
    return res.status(200).json({ data, message: "Filter added successfully." })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

const verifyEmailOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;

    if (!otp || !email) {
      return res.status(403).json({
        success: false,
        message: 'Email and otp fields are required',
      });
    }

    const response = await otpModel.find({ email }).sort({ createdAt: -1 }).limit(1);
    if (response.length === 0 || otp !== response[0].otp) {
      return res.status(400).json({
        success: false,
        message: 'The OTP is not valid',
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Verified',
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

const serchUserData = async (search) => {
  const regex = new RegExp(search, 'i');
  const fieldsToSearch = [
    'name',
    'email',
    'phoneNumber',
    'role',
    'companyName',
    'companyAddress',
    'state',
    'city',
    'status',
  ];
  return fieldsToSearch.map((field) => ({ [field]: regex }));
}

const getCpApporovalUsersList = async (req, res, next) => {
  try {
    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) < 10 ? 10 : Number(req.query.limit);
    let skip = (page) * limit;
    let data = await users.find({ cpRequest: "requested" }).skip(skip).limit(limit);

    const totalDocuments = await users.countDocuments({ cpRequest: "requested" });
    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      data,
      nbHits: data.length,
      pageNumber: page,
      totalPages: totalPages,
      totalItems: totalDocuments,
    });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const approveCp = async (req, res) => {
  try {
    const result = await users.findByIdAndUpdate({ _id: req.body.id }, { cpRequest: "approved", status: "active" });
    const notifToSave = {
      status: 0,
      type: "Broker",
      subType: "Approved",
      title: `Broker approved`,
      details: `Your broker account has been approved.`,
      userId: result?._id,
      admin: false,
    };
    const newNotif = new notifications(notifToSave);
    await newNotif.save();
    await transporter.sendMail({
      from: "propertyp247@gmail.com",
      to: [result?.email || "", "tanish@techhelps.co.in"],
      subject: "BuilderFloor Broker Registration",
      html: `
            <div
              style="max-width: 90%; margin: auto; padding-top: 20px;"
            >
              <br/>
              <span style="font-weight:800; display:block;">Your broker account has been approved & activated for <a href="https://builderfloor.com">builderfloor.com</a>. Now you can log in to your broker account.</span>
            </div>
          `,
    });
    // also send to the whatsapp --- "Hi NAME, your account on builderfloor.com has been approved and the password is sent to your registered email."

    return res.status(200).json({ data: result, message: "Channel partner approved successfully." })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const getUnapprovedBrokerCounts = async (req, res) => {
  try {
    const totalDocuments = await users.countDocuments({ cpRequest: "requested" });
    const data = [
      { label: "Unapproved Brokers", value: totalDocuments },
    ];
    return res.status(200).json({ response: data });
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const getNotificationsList = async (req, res) => {
  try {
    const { uid } = req.query;
    return res.json({ success: true, message: "", data: [] });
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const deleteNotification = async (req, res) => {
  try {
    const { uid, nid } = req.query;
    return res.json({ success: true, message: "notification deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await users.findOne({ email: email })
    if (userData) {
      const randomString = randomstring.generate();
      await users.updateOne({ email: email }, { $set: { token: randomString } });
      sendResetPasswordMail(userData.name, userData.email, randomString)
      res.status(200).send({
        success: true,
        massage: 'Please Check your inbox and reset your password',
      })
    }
    else {
      res.status(200).send({
        success: true,
        massage: "this email does not exist",
      })
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
}


const sendResetPasswordMail = async (name, email, token) => {
  try {
    const html = `<p> Hiii ${name} please copy the link <a href="https://builderfloor.com/reset-password?token=${token}"> reset your password </a>.`;
    const sent = await sendEmail(email, 'For Reset password', html);
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
}

async function sendEmail(to, subject, html) {
  return new Promise(async (resolve, reject) => {
    let info = await transporter
      .sendMail({
        from: "propertyp247@gmail.com",
        to: [to || "dpundir72@gmail.com"],
        subject,
        text: "Text Here!",
        html,
      })
      .catch((e) => {
        reject(e);
      });

    if (info?.messageId) {
      resolve("email sent");
    }
  });
}

const reset_password = async (req, res) => {
  try {
    const token = req.body.token;
    const tokenData = await users.findOne({ token: token });
    if (tokenData) {
      const newPassword = await bcrypt.hash(req.body.newPassword, 8)
      const UserData = await users.findByIdAndUpdate(
        { _id: tokenData._id },
        { $set: { password: req.body.newPassword, token: "" } },
        { new: true }
      );
      res.status(200).send({
        success: true,
        massage: 'User password has been reset successfully',
        data: UserData,
      })
    }
    else {
      res.status(200).send({
        success: false,
        massage: "Unauthorized.",
      })
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
}

export default {
  getusersList,
  getAdminUsersList,
  getAdminUserDataById,
  handleSignup,
  handleVerifyOTP,
  getusersById,
  deleteusersById,
  updateEditUsers,
  getusersChildren,
  login,
  filterUsers,
  Edit_update,
  getChannelPartnersList,
  addUserLocation,
  updateUserStatus,
  sendOTP,
  addUserFilters,
  verifyEmailOtp,
  getCpApporovalUsersList,
  approveCp,
  getUnapprovedBrokerCounts,
  getNotificationsList,
  deleteNotification,
  forgotPassword,
  reset_password
};
