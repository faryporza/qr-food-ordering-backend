import mongoose from 'mongoose';

const checkoutSchema = new mongoose.Schema(
  {
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    pinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pin',
      required: true,
    },
    orders: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order',
        },
        menuItemId: {
          name: String,
          price: Number,
        },
        amount: Number,
        totalPrice: Number,
        note: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'qr', 'card'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Checkout = mongoose.model('Checkout', checkoutSchema);

export default Checkout;
