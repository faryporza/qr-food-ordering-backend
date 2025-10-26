import Checkout from '../models/Checkout.js';
import Pin from '../models/Pin.js';
import Order from '../models/Order.js';
import Table from '../models/Table.js';

// Get checkout summary by PIN (สำหรับดูรายละเอียดก่อนชำระเงิน)
export const getCheckoutByPin = async (req, res) => {
  try {
    // ตรวจสอบ role (เฉพาะ employee และ admin)
    if (req.user.role !== 'employee' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึง',
      });
    }

    const { pinId } = req.params;

    // ตรวจสอบว่า pin ยัง active อยู่
    const pin = await Pin.findOne({ _id: pinId, status_pin: 'active' })
      .populate('tableId', 'tableNumber');

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ PIN นี้หรือ PIN ไม่ active',
      });
    }

    // ดึง order ทั้งหมดของ pin นี้ ที่สถานะ completed (พร้อมคิดเงิน)
    const orders = await Order.find({
      pinId,
      status: 'completed',
    }).populate('menuItemId', 'name price image');

    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีรายการอาหารที่เสร็จสิ้นแล้ว',
      });
    }

    // 🧮 รวมจำนวนเมนูซ้ำกัน (group by menuItemId)
    const menuSummary = {};
    let totalAmount = 0;

    const orderDetails = orders.map((o) => {
      const menuName = o.menuItemId.name;
      const menuPrice = o.menuItemId.price;

      // สรุปรายการ
      if (!menuSummary[menuName]) {
        menuSummary[menuName] = {
          name: menuName,
          price: menuPrice,
          count: 0,
          total: 0,
        };
      }
      menuSummary[menuName].count += o.amount;
      menuSummary[menuName].total += o.totalPrice;

      totalAmount += o.totalPrice;

      return {
        _id: o._id,
        menuItemId: {
          name: o.menuItemId.name,
          price: o.menuItemId.price,
        },
        amount: o.amount,
        totalPrice: o.totalPrice,
        note: o.note || '',
      };
    });

    res.json({
      success: true,
      data: {
        tableId: {
          _id: pin.tableId._id,
          tableNumber: pin.tableId.tableNumber,
        },
        pinId: {
          _id: pin._id,
          pin: pin.pin,
        },
        orders: orderDetails,
        menuSummary: Object.values(menuSummary), // แปลง object เป็น array
        totalAmount,
      },
    });
  } catch (error) {
    console.error('Get checkout by PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล checkout',
    });
  }
};

// สร้าง Checkout และชำระเงิน
export const createCheckout = async (req, res) => {
  try {
    // ตรวจสอบ role (เฉพาะ employee และ admin)
    if (req.user.role !== 'employee' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึง',
      });
    }

    const { pinId, paymentMethod } = req.body;

    // ตรวจสอบว่า pin ยัง active อยู่
    const pin = await Pin.findOne({ _id: pinId, status_pin: 'active' })
      .populate('tableId', 'tableNumber');

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ PIN นี้หรือ PIN ไม่ active',
      });
    }

    // ดึง order ทั้งหมดที่ completed
    const orders = await Order.find({
      pinId,
      status: 'completed',
    }).populate('menuItemId', 'name price');

    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีรายการอาหารที่เสร็จสิ้นแล้ว',
      });
    }

    // คำนวณยอดรวม และเตรียมข้อมูล orders
    let totalAmount = 0;
    const orderDetails = orders.map((o) => {
      totalAmount += o.totalPrice;
      return {
        _id: o._id,
        menuItemId: {
          name: o.menuItemId.name,
          price: o.menuItemId.price,
        },
        amount: o.amount,
        totalPrice: o.totalPrice,
        note: o.note || '',
      };
    });

    // สร้าง Checkout
    const checkout = await Checkout.create({
      tableId: pin.tableId._id,
      pinId: pin._id,
      orders: orderDetails,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      status: 'paid',
      paidAt: new Date(),
      paidBy: req.user._id, // พนักงานที่ทำการชำระเงิน
    });

    // Populate ข้อมูล paidBy
    await checkout.populate('paidBy', 'username name');
    await checkout.populate('tableId', 'tableNumber');
    await checkout.populate('pinId', 'pin');

    // ปิด PIN (inactive)
    await Pin.findByIdAndUpdate(pinId, { status_pin: 'inactive' });

    res.status(201).json({
      success: true,
      message: 'ชำระเงินสำเร็จ',
      data: checkout,
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการชำระเงิน',
    });
  }
};

// ดึงประวัติ Checkout ทั้งหมด (Admin/Employee)
export const getAllCheckouts = async (req, res) => {
  try {
    // ตรวจสอบ role (เฉพาะ employee และ admin)
    if (req.user.role !== 'employee' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึง',
      });
    }

    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    
    // Filter by date range
    if (startDate || endDate) {
      query.paidAt = {};
      if (startDate) query.paidAt.$gte = new Date(startDate);
      if (endDate) query.paidAt.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalItems = await Checkout.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    const checkouts = await Checkout.find(query)
      .populate('tableId', 'tableNumber')
      .populate('pinId', 'pin')
      .populate('paidBy', 'username name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: checkouts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Get all checkouts error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล checkout',
    });
  }
};

// ดึง Checkout ตาม ID
export const getCheckoutById = async (req, res) => {
  try {
    // ตรวจสอบ role (เฉพาะ employee และ admin)
    if (req.user.role !== 'employee' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึง',
      });
    }

    const { id } = req.params;

    const checkout = await Checkout.findById(id)
      .populate('tableId', 'tableNumber')
      .populate('pinId', 'pin')
      .populate('paidBy', 'username name');

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ checkout นี้',
      });
    }

    res.json({
      success: true,
      data: checkout,
    });
  } catch (error) {
    console.error('Get checkout by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล checkout',
    });
  }
};
