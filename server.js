import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import UsersRoutes from "./routes/UsersRoute.js";
import propertiesRoutes from "./routes/propertiesRoute.js";
import mastersRoutes from "./routes/mastersRoute.js";
import customersRoute from "./routes/customersRoute.js";
import notificationsRoute from "./routes/notificationsRoute.js";
import contentRoute from "./routes/contentRoutes.js";

const app = express();
dotenv.config();
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "techHelps",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// mongoose.connect("mongodb+srv://akhil1659:akhil1659@cluster0.35ongwb.mongodb.net/", { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect(
  "mongodb://builderFloor:new12Builder@178.16.139.175:27017/builderFloor?authSource=admin",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
const db = mongoose.connection;
db.on("error", (err) => {
  console.log(err);
});

db.once("open", () => {
  console.log("Database Connected");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

app.use("/api/properties", propertiesRoutes);
app.use("/api/users", UsersRoutes);
app.use("/api/masters", mastersRoutes);
app.use("/api/customers", customersRoute);
app.use("/api/notifications", notificationsRoute);
app.use("/api/content", contentRoute);
