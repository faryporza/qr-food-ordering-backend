import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'กรุณากรอกชื่อเมนู'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'กรุณาเลือกหมวดหมู่'],
    },
    price: {
      type: Number,
      required: [true, 'กรุณากรอกราคา'],
      min: [0, 'ราคาต้องไม่ติดลบ'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
menuItemSchema.index({ isDeleted: 1, isVisible: 1, category: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
