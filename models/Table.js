import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: [true, "หมายเลขโต๊ะไม่สามารถเว้นว่างได้"],
    trim: true,
    unique: true
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
tableSchema.index({ isDeleted: 1 });

// Virtual for formatting
tableSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    return ret;
  }
});

export default mongoose.model("Table", tableSchema);
