import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "ชื่อหมวดหมู่ไม่สามารถเว้นว่างได้"],
    trim: true,
    unique: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Number,
    default: 0,
    enum: [0, 1] // 0 = ยังอยู่, 1 = ถูกลบ
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
categorySchema.index({ isDeleted: 1, isVisible: 1 });

// Virtual for formatting
categorySchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    return ret;
  }
});

export default mongoose.model("Category", categorySchema);
