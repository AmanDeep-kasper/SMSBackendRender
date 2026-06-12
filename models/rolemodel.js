import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    import: { type: Boolean, default: false },
    all: { type: Boolean, default: false },
  },
  { _id: false },
);

const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    isSystemRole: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    modulePermissions: {
      type: Map,
      of: permissionSchema,
      default: {},
    },
  },
  { timestamps: true },
);

roleSchema.index({ roleName: 1, schoolId: 1 }, { unique: true });

const Role =
  mongoose.models.Role ||
  mongoose.model("Role", roleSchema);

export default Role;
