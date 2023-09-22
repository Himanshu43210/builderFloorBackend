import users from "../models/UsersModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import otpModel from "../models/otpModel.js";
import otpGenerator from "otp-generator";
import transporter from "../utils/mail-transporter.js"

import { BUILDER_FLOOR_ADMIN, CHANNEL_PARTNER, SALES_USER } from "../const.js";
import crypto from "crypto";

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
        existingUser.password = hashedPassword;
      }

      // Update other user data
      existingUser.set(data);

      // Save the updated user to the database
      await existingUser.save();
      return res.json(existingUser);
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new users({ ...data, password: hashedPassword });

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
    const query = { parentId: id };
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
      status: req.body.status,
      parentId:
        req.body.role === USER_ROLE[BUILDER_FLOOR_ADMIN]
          ? "Approved"
          : req.body.parentId, // password: hashedPassword,
      password: req.body.password || "123",
    };
    let data = await users.findOne({ _id: req.body._id });

    if (data) {
      const updatedData = await users.findByIdAndUpdate(id, {
        $set: dataToSave,
      });
      return res.status(200).json({ messgae: "users updated" });
    }

    const { name, email, phoneNumber, emailOtp, companyName, companyAddress, parentId, state, city } = req.body;
    if (!name || !email || !phoneNumber || !companyName || !companyAddress || !parentId || !state || !city) {
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

    if (emailOtp) {
      const response = await otpModel.find({ email }).sort({ createdAt: -1 }).limit(1);
      if (response.length === 0 || emailOtp !== response[0].otp) {
        return res.status(400).json({
          success: false,
          message: 'The OTP is not valid',
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'emailOtp field is required',
      });
    }

    const bytes = crypto.randomBytes(12 / 2);
    const pass = bytes.toString('hex');
    dataToSave.password = pass;
    await transporter.sendMail({
      from: "propertyp247@gmail.com",
      to: [email, "dpundir72@gmail.com"],
      subject: "Builder floor signup Email",
      html: `
            <div
              style="max-width: 90%; margin: auto; padding-top: 20px;"
            >
              <br/>
              <span style="font-weight:800; display:block;">${pass} is your password for builderfloor.com .</span>
            </div>
          `,
    });
    const newUser = new users(dataToSave);
    await newUser.save();
    res.send({ message: "New Users Stored." });
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

    const data = {
      user: {
        id: user.id,
      },
    };
    const authToken = jwt.sign(data, JWT_SECERET);
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
    res.json({ authToken, profile });
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
    res.status(200).json({ message: "User deleted", deletedUser });
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
      password: hashedPassword,
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

export default {
  getusersList,
  getAdminUsersList,
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
  addUserFilters
};
