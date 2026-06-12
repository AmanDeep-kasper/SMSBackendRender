// import Visitor from "../../models/FrontDesk/VisitorRegister.js"

// export const addVisitorRegister = async (req, res) => {
//   try {
//     const { 
//       date, 
//       name, 
//       phone, 
//       purpose, 
//       idProofNumber, 
//       noOfPerson, 
//       note, 
    
//       checkInTime 
//     } = req.body;

//     const finalDate = date && date.trim() !== "" 
//       ? date 
//       : new Date().toISOString().split('T')[0];

//     const finalCheckInTime = checkInTime && checkInTime.trim() !== "" 
//       ? checkInTime 
//       : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//     const newVisitor = new Visitor({
//       date: finalDate,
//       name,
//       phone,
//       purpose,
//       idProofNumber,
//       noOfPerson,
//       note,
    
//       checkInTime: finalCheckInTime,
//       checkOutTime: '',
//       status: 'Checked In',
    
//     });

//     await newVisitor.save();
    
//     res.status(201).json({
//       success: true,
//       message: 'Visitor checked in successfully',
//       data: newVisitor
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// };

// export const updateVisitorStatusOnCheckOut = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { checkOutTime } = req.body;

//     const finalCheckOutTime = checkOutTime && checkOutTime.trim() !== "" 
//       ? checkOutTime 
//       : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//     const updatedVisitor = await Visitor.findByIdAndUpdate(
//       id,
//       {
//         checkOutTime: finalCheckOutTime,
//         status: 'Checked Out'
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedVisitor) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Visitor not found" 
//       });
//     }

//     res.status(200).json({ 
//       success: true, 
//       message: "Visitor status updated to Checked Out successfully", 
//       data: updatedVisitor
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// };

// export const getVisitorDetails = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const visitor = await Visitor.findById(id);

//     if (!visitor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Visitor record not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: visitor
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// export const getAllVisitors = async (req, res) => {
//   try {
//     const visitors = await Visitor.find().sort({ createdAt: -1 });
    
//     res.status(200).json({
//       success: true,
//       data: visitors
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// };

