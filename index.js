import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import schoolRoutes from "./routes/SchoolRoute.js";
import studentsRoutes from "./routes/studentsroute.js";
import authRoutes from "./routes/authroute.js";
import roleRoutes from "./routes/roleroute.js";
import forgotPasswordRoute from "./routes/forgotPasswordroute.js";
import createDefaultRolesIfNotExist from "./utils/createDefaultRoles.js";
import AddRoomRoute from "./routes/Academic/AddRoomRoute.js";
import addClassRoute from "./routes/Academic/AddClassRoute.js";
import createQuestion from "./routes/CreateQuestionRoutes.js";
import studyMaterialRoutes from './routes/studyMaterialRoutes.js'
import AddSubjectRoute from "./routes/Academic/AddSubjectRoute.js";
// import visitorRegisterRoutes from "./routes/FrontDesk/visitorRegisterRoutes.js";
import TimetableSettings from "./routes/Academic/TimeTable/TimeTableSetting.js";
import classTimetableRoutes from "./routes/Academic/TimeTable/classTimetableRoutes.js";
import staffRoutes from "./routes/Staffs/AllStaff.js";
// import HomeWorkRoutes from "./routes/HomeworkRoutes.js"
import eventRoutes from "./routes/EventRoutes.js";
import noticeRoutes from "./routes/Noticeroute.js";
import HomeWorkRoutes from "./routes/HomeworkRoutes.js";
import HomeWorkSubmissionRoutes from "./routes/homeworkSubmissionRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import OnlineClassRoutes from './routes/OnlineClassRoutes.js'
import digitalSignatureRoutes from "./routes/digitalSignatureRoutes.js";

// Online Test
import createTestRoutes from "./routes/CreateTestRoutes.js";

dotenv.config();
connectDB();

createDefaultRolesIfNotExist();

const app = express();

// Allow multiple origins for development
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5174",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

// Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL || "http://localhost:3000",
//   credentials: true, // Important for cookies
// }));

// index.js - Update your CORS settings
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // Important for cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cookie",
    ],
    exposedHeaders: ["Set-Cookie"],
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
// users Routes

// auth Routes
app.use("/api/auth", authRoutes);
// school Routes
app.use("/api/school", schoolRoutes);
app.use("/api/users", studentsRoutes);

// staff
app.use("/api/staff", staffRoutes);

app.use("/api/users", studentsRoutes);
// Add Room Routes
app.use("/api/rooms", AddRoomRoute);
// Add Class Routes
app.use("/api/classes", addClassRoute);
// Add Subject Routes
app.use("/api/subjects", AddSubjectRoute);

// Add TimeTable Routes
app.use("/api/timetable", TimetableSettings);
app.use("/api/timetable", classTimetableRoutes);

// role route
app.use("/api/role", roleRoutes);
app.use("/api/forgot", forgotPasswordRoute);

// Online Test
app.use("/api/tests", createTestRoutes);
// create Test
app.use("/api/question", createQuestion);

// study materials
app.use("/api/studymaterials",studyMaterialRoutes);


//viistorRegister
// app.use("/api/visitor_register",visitorRegisterRoutes);
// homework
app.use("/api/homework",HomeWorkRoutes )

// events & calendar
app.use("/api/events", eventRoutes);
//Notice
app.use("/api/notices", noticeRoutes);
// certificates
app.use("/api/certificates", certificateRoutes);
// homeworksubmission
app.use('/api/homeworksubmission',HomeWorkSubmissionRoutes)

// Online class 
app.use("/api/onlineclass",OnlineClassRoutes );

// Digital Signature
app.use("/api/digital-signature", digitalSignatureRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
