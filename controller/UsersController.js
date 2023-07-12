import mongoose from 'mongoose';
import users from "../models/usersModel.js";
import csv from "csvtojson";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import sgMail from "@sendgrid/mail";


const filePath = "./data.json"
const JWT_SECERET = "techHelps"
const salt = await bcrypt.genSalt();

const getusersList = async (req, res, next) => {
  try {
    const filter = req.query.filter;

    const filteredUsers = await users.find();

    if (filter.email && filter.email.length > 0) {
      filteredUsers = filteredUsers.filter(users =>
        filter.email.includes(users.email)
      );
    }
  
    if (filter.phoneNumber && filter.phoneNumber.length > 0) {
      filteredUsers = filteredUsers.filter(users =>
        filter.phoneNumber.includes(users.phoneNumber)
      );
    }
  
    if (filter.name && filter.name.length > 0) {
      filteredUsers = filteredUsers.filter(users =>
        filter.name.includes(users.name)
      );
    }
    res.status(200).json({ filteredUsers })
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" })
  }
}

const updateusersByID = async (req, res, next) => {
  try {
    let id = req.query.id
    let updateData = req.body
    const updatedData = await users.findByIdAndUpdate(id, { $set: updateData })
    res.status(200).json({ messgae: "users updated" })
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" })
  }
}

const getusersById = async (req, res, next) => {
  try {
    let id = req.query.id
    let data = await users.findById(id)
    res.status(200).json({ data })
  } catch (err) {
    res.status(400).json({ messgae: err.message })
  }
}

const login = async (req, res) => {
  try {
    const user = await users.findOne({ email: req.body.email })

    if (!user) {
      return res.status(401).send({ message: "Invalid email or password." })
    }

    if (!user.isVerified) {
      return res.status(401).send({ message: "Please verify your email before logging in." })
    }
    const passwordMatch = await bcrypt.compare(req.body.password, user.password)
    if (!passwordMatch) {
      return res.status(401).send({ message: "Invalid email or password." })
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECERET)

    res.json({ success, authToken, user })
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: "Error logging in." })
  }
}

const deleteusersById = async (req, res, next) => {
  try {
    const id = req.query.id
    const deletedUser = await users.findByIdAndRemove(id)
    if (!deletedUser) {
      res.status(404).json({ message: "User not found" })
      return
    }
    res.status(200).json({ message: "User deleted", deletedUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}


const handleSignup = async (req, res) => {
  try {
    // Find the user in the database by email
    const user = await users.findOne({ email: req.body.email })

    // If the user already exists, return an error
    if (user && user.isVerified) {
      return res.status(409).send({ message: "User already exists." })
    }

    // Generate a new OTP if the user exists but is not verified
    let otp
    if (user && !user.isVerified) {
      await user.save()
    } else {
      // Create a new user in the database
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      const newUser = new users({
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        role: req.body.role,
        parentId: req.body.parentId,
        password: hashedPassword,
      })
      await newUser.save()
    }
    // Create a new user in the databas
    res.send({ message: "OTP sent successfully." })
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: "Error sending OTP." })
  }
}

const handleVerifyOTP = async (req, res) => {
  try {
    const user = await users.findOne({ email: req.session.email })

    if (!user) {
      return res.status(401).send({ message: "User not found." })
    }


    if (req.body.otp === req.session.otp) {

      delete req.session.otp
      delete req.session.email

      user.isVerified = true
      await user.save()


      const token = jwt.sign({ userId: user._id }, JWT_SECERET)

      res.send({ token })
    } else {

      res.status(401).send({ message: "Invalid OTP." })
    }
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: "Error verifying OTP." })
  }
}


const getusersChildren= async (req, res, next) => {
  try {
    const userId = req.query.id;
    const users = await Users.find({ Parentid: userId });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
}

export default {
  getusersList,
  handleSignup,
  handleVerifyOTP,
  getusersById,
  deleteusersById,
  updateusersByID,
  getusersChildren,
  login,
}
