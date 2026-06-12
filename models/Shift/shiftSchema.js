const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Shift name is required"],
    maxlength: 50,
  },
  startTime: {
    type: String,
    required: [true, "Start time is required"],
  },
  endTime: {
    type: String,
    required: [true, "End time is required"],
  },
  minLoginHours: {
    type: Number,
    required: [true, "Minimum login hours are required"],
    min: [0, "Minimum login hours must be greater than or equal to 0"],
  },
  minLoginMinutes: {
    type: Number,
    required: [true, "Minimum login minutes are required"],
    min: [0, "Minimum login minutes must be greater than or equal to 0"],
    max: [59, "Minimum login minutes must be less than 60"],
  },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
});

//  Prevent model overwriting
const Shift = mongoose.models.Shift || mongoose.model("Shift", shiftSchema);

module.exports = Shift;