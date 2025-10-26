import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    pinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pin',
      required: [true, 'กรุณาระบุ PIN'],
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'กรุณาระบุโต๊ะ'],
    },
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: [true, 'กรุณาระบุเมนู'],
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'กรุณาระบุจำนวน'],
      min: [1, 'จำนวนต้องมากกว่า 0'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'กรุณาระบุราคารวม'],
      min: [0, 'ราคาต้องไม่ติดลบ'],
    },
    status: {
      type: String,
      enum: ['pending', 'cooking', 'served', 'completed', 'cancel'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
orderSchema.index({ pinId: 1, status: 1 });
orderSchema.index({ tableId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
