import Pin from '../models/Pin.js';
import Table from '../models/Table.js';

// Generate random PIN (6 characters)
const generatePin = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let pin = '';
  for (let i = 0; i < 6; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
};

// Get all pins
export const getAllPins = async (req, res) => {
  try {
    const { status_pin } = req.query;
    const query = {};

    // Filter by status_pin if provided
    if (status_pin) {
      query.status_pin = status_pin;
    }

    const pins = await Pin.find(query)
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pins,
    });
  } catch (error) {
    console.error('Get all pins error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล PIN',
    });
  }
};

// Get pin by PIN code
export const getPinByCode = async (req, res) => {
  try {
    const { pin } = req.params;

    const pinDoc = await Pin.findOne({
      pin,
      status_pin: 'active',
    }).populate('tableId', 'tableNumber');

    if (!pinDoc) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ PIN นี้หรือ PIN ไม่ active',
      });
    }

    res.json({
      success: true,
      data: pinDoc,
    });
  } catch (error) {
    console.error('Get pin by code error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล PIN',
    });
  }
};

// Create new pin (Open table - Admin & Employee)
export const createPin = async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เปิดโต๊ะ',
      });
    }

    const { tableId } = req.body;

    // Verify table exists
    const table = await Table.findOne({ _id: tableId, isDeleted: 0 });
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบโต๊ะนี้',
      });
    }

    // Close all active pins for this table
    await Pin.updateMany(
      { tableId, status_pin: 'active' },
      { status_pin: 'inactive' }
    );

    // Generate unique PIN
    let newPin;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      newPin = generatePin();
      const existing = await Pin.findOne({ pin: newPin });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'ไม่สามารถสร้าง PIN ที่ไม่ซ้ำได้ กรุณาลองใหม่',
      });
    }

    // Create new pin
    const pin = await Pin.create({
      pin: newPin,
      tableId,
      tableNumber: table.tableNumber,
      status_pin: 'active',
    });

    const populatedPin = await Pin.findById(pin._id).populate(
      'tableId',
      'tableNumber'
    );

    res.status(201).json({
      success: true,
      message: 'เปิดโต๊ะสำเร็จ',
      data: populatedPin,
    });
  } catch (error) {
    console.error('Create pin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการสร้าง PIN',
    });
  }
};

// Update pin status (Admin & Employee)
export const updatePinStatus = async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์อัปเดต PIN',
      });
    }

    const { id } = req.params;
    const { status_pin } = req.body;

    const updateData = {};
    if (status_pin !== undefined) updateData.status_pin = status_pin;

    const pin = await Pin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('tableId', 'tableNumber');

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ PIN นี้',
      });
    }

    res.json({
      success: true,
      message: 'อัพเดท PIN สำเร็จ',
      data: pin,
    });
  } catch (error) {
    console.error('Update pin status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัพเดท PIN',
    });
  }
};

// Close table (set status_pin to inactive - Admin & Employee)
export const closeTable = async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ปิดโต๊ะ',
      });
    }

    const { id } = req.params;

    const pin = await Pin.findByIdAndUpdate(
      id,
      { status_pin: 'inactive' },
      { new: true }
    ).populate('tableId', 'tableNumber');

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ PIN นี้',
      });
    }

    res.json({
      success: true,
      message: 'ปิดโต๊ะสำเร็จ',
      data: pin,
    });
  } catch (error) {
    console.error('Close table error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการปิดโต๊ะ',
    });
  }
};

// Mark as paid (Admin & Employee)
export const markAsPaid = async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ทำรายการชำระเงิน',
      });
    }

    const { id } = req.params;

    // Close the table
    const pin = await Pin.findByIdAndUpdate(
      id,
      { status_pin: 'inactive' },
      { new: true }
    ).populate('tableId', 'tableNumber');

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ PIN นี้',
      });
    }

    res.json({
      success: true,
      message: 'บันทึกการชำระเงินสำเร็จ',
      data: pin,
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการชำระเงิน',
    });
  }
};

// Get active tables
export const getActiveTables = async (req, res) => {
  try {
    const activePins = await Pin.find({ status_pin: 'active' })
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: activePins,
    });
  } catch (error) {
    console.error('Get active tables error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโต๊ะที่เปิดอยู่',
    });
  }
};
