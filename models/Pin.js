import mongoose from 'mongoose';

const pinSchema = new mongoose.Schema(
  {
    pin: {
      type: String,
      required: [true, 'กรุณากรอก PIN'],
      unique: true,
      trim: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'กรุณาเลือกโต๊ะ'],
    },
    tableNumber: {
      type: String,
      required: [true, 'กรุณากรอกหมายเลขโต๊ะ'],
    },
    status_pin: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
pinSchema.index({ pin: 1, status_pin: 1 });
pinSchema.index({ tableId: 1, status_pin: 1 });

const Pin = mongoose.model('Pin', pinSchema);

export default Pin;
