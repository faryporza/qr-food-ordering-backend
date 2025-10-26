import Order from '../models/Order.js';
import Pin from '../models/Pin.js';
import MenuItem from '../models/MenuItem.js';

// Get all orders (Admin & Employee)
export const getAllOrders = async (req, res) => {
  try {
    const { status, pinId, tableId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (pinId) query.pinId = pinId;
    if (tableId) query.tableId = tableId;

    const orders = await Order.find(query)
      .populate('pinId', 'pin tableNumber status_pin')
      .populate('tableId', 'tableNumber')
      .populate('menuItemId', 'name price image category')
      .sort({ createdAt: -1 });

    // Filter only orders from active PINs
    const activeOrders = orders.filter(order => order.pinId?.status_pin === 'active');

    res.json({
      success: true,
      data: activeOrders,
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์',
    });
  }
};

// Get orders by PIN (Public - for customer)
export const getOrdersByPin = async (req, res) => {
  try {
    const { pin } = req.params;

    // Verify PIN exists and is active
    const pinDoc = await Pin.findOne({ pin, status_pin: 'active' });
    if (!pinDoc) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ PIN นี้หรือ PIN ไม่ active',
      });
    }

    const orders = await Order.find({ pinId: pinDoc._id })
      .populate('menuItemId', 'name price image')
      .sort({ createdAt: -1 });

    // Calculate summary
    const summary = {
      totalItems: orders.reduce((sum, order) => sum + order.amount, 0),
      totalPrice: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      orderCount: orders.length,
      statusCount: {
        pending: orders.filter((o) => o.status === 'pending').length,
        cooking: orders.filter((o) => o.status === 'cooking').length,
        served: orders.filter((o) => o.status === 'served').length,
        completed: orders.filter((o) => o.status === 'completed').length,
        cancel: orders.filter((o) => o.status === 'cancel').length,
      },
    };

    res.json({
      success: true,
      data: {
        orders,
        summary,
        pin: {
          _id: pinDoc._id,
          pin: pinDoc.pin,
          tableNumber: pinDoc.tableNumber,
        },
      },
    });
  } catch (error) {
    console.error('Get orders by PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์',
    });
  }
};

// Create order (Customer via PIN)
export const createOrder = async (req, res) => {
  try {
    const { pin, items } = req.body; // items = [{menuItemId, amount, note}]

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกเมนูอาหาร',
      });
    }

    // Verify PIN
    const pinDoc = await Pin.findOne({ pin, status_pin: 'active' });
    if (!pinDoc) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ PIN นี้หรือ PIN ไม่ active',
      });
    }

    // Create orders
    const createdOrders = [];
    for (const item of items) {
      // Get menu item
      const menuItem = await MenuItem.findOne({
        _id: item.menuItemId,
        isDeleted: 0,
        isVisible: true,
      });

      if (!menuItem) {
        continue; // Skip invalid menu items
      }

      const order = await Order.create({
        pinId: pinDoc._id,
        tableId: pinDoc.tableId,
        menuItemId: item.menuItemId,
        note: item.note || '',
        amount: item.amount,
        totalPrice: menuItem.price * item.amount,
        status: 'pending',
      });

      const populatedOrder = await Order.findById(order._id)
        .populate('menuItemId', 'name price image')
        .populate('tableId', 'tableNumber');

      createdOrders.push(populatedOrder);
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('order:created', {
        orders: createdOrders,
        tableNumber: pinDoc.tableNumber,
        pin: pinDoc.pin,
      });
    }

    res.status(201).json({
      success: true,
      message: 'สั่งอาหารสำเร็จ',
      data: createdOrders,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการสั่งอาหาร',
    });
  }
};

// Update order status (Admin & Employee)
export const updateOrderStatus = async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์อัปเดตออเดอร์',
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'cooking', 'served', 'completed', 'cancel'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'สถานะไม่ถูกต้อง',
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('pinId', 'pin tableNumber')
      .populate('tableId', 'tableNumber')
      .populate('menuItemId', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์นี้',
      });
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('order:updated', order);
    }

    res.json({
      success: true,
      message: 'อัปเดตสถานะสำเร็จ',
      data: order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัปเดตออเดอร์',
    });
  }
};

// Delete order (Admin only)
export const deleteOrder = async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะ Admin เท่านั้นที่ลบออเดอร์ได้',
      });
    }

    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์นี้',
      });
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('order:deleted', { orderId: id });
    }

    res.json({
      success: true,
      message: 'ลบออเดอร์สำเร็จ',
      data: order,
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบออเดอร์',
    });
  }
};
