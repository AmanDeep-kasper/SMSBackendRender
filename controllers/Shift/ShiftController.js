import Shift from "../../models/Shift/shiftSchema.js";
import { Staff } from "../../models/Staffs/AddStaff.models.js";

// Create a shift
export const CreateShift = async (req, res) => {
  try {
    const { name, startTime, endTime, minLoginHours, minLoginMinutes, staff } =
      req.body;

    // Check if a shift is being updated or created
    let shift;
    if (req.params.id) {
      // Update the shift if an ID is provided
      shift = await shift.findByIdAndUpdate(
        req.params.id,
        {
          name,
          startTime,
          endTime,
          minLoginHours,
          minLoginMinutes,
          staff,
        },
        { new: true },
      );
    } else {
      // Create a new shift
      shift = new Shift({
        name,
        startTime,
        endTime,
        minLoginHours,
        minLoginMinutes,
        staff,
      });
      await shift.save();
    }

    res.status(200).json({ shift });
  } catch (error) {
    res.status(500).json({ message: "Error creating/updating shift", error });
  }
};

module.exports= {
    CreateShift
}