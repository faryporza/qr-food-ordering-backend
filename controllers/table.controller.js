import Table from "../models/Table.js";

// Get all tables (not deleted)
export const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find({ isDeleted: 0 }).sort({ tableNumber: 1 });
    
    res.json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    console.error("Get all tables error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลโต๊ะ" 
    });
  }
};

// Get table by ID
export const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await Table.findOne({ 
      _id: id, 
      isDeleted: 0 
    });
    
    if (!table) {
      return res.status(404).json({ 
        success: false,
        message: "ไม่พบโต๊ะนี้" 
      });
    }
    
    res.json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error("Get table by ID error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลโต๊ะ" 
    });
  }
};

// Create new table
export const createTable = async (req, res) => {
  try {
    const { tableNumber } = req.body;
    
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มโต๊ะได้" 
      });
    }
    
    // Validate required fields
    if (!tableNumber) {
      return res.status(400).json({ 
        success: false,
        message: "กรุณาระบุหมายเลขโต๊ะ" 
      });
    }
    
    // Check if table number already exists
    const existingTable = await Table.findOne({ 
      tableNumber: tableNumber.trim(), 
      isDeleted: 0 
    });
    
    if (existingTable) {
      return res.status(400).json({ 
        success: false,
        message: "มีโต๊ะหมายเลขนี้อยู่แล้ว" 
      });
    }
    
    // Create new table
    const table = new Table({
      tableNumber: tableNumber.trim()
    });
    
    await table.save();
    
    res.status(201).json({
      success: true,
      message: "สร้างโต๊ะสำเร็จ",
      data: table
    });
  } catch (error) {
    console.error("Create table error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างโต๊ะ" 
    });
  }
};

// Update table
export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber } = req.body;
    
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขโต๊ะได้" 
      });
    }
    
    const table = await Table.findOne({ 
      _id: id, 
      isDeleted: 0 
    });
    
    if (!table) {
      return res.status(404).json({ 
        success: false,
        message: "ไม่พบโต๊ะนี้" 
      });
    }
    
    // Check if new table number conflicts with existing table
    if (tableNumber && tableNumber.trim() !== table.tableNumber) {
      const existingTable = await Table.findOne({ 
        tableNumber: tableNumber.trim(), 
        isDeleted: 0,
        _id: { $ne: id }
      });
      
      if (existingTable) {
        return res.status(400).json({ 
          success: false,
          message: "มีโต๊ะหมายเลขนี้อยู่แล้ว" 
        });
      }
      
      table.tableNumber = tableNumber.trim();
    }
    
    await table.save();
    
    res.json({
      success: true,
      message: "อัปเดตโต๊ะสำเร็จ",
      data: table
    });
  } catch (error) {
    console.error("Update table error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตโต๊ะ" 
    });
  }
};

// Soft delete table
export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบโต๊ะได้" 
      });
    }
    
    const table = await Table.findOne({ 
      _id: id, 
      isDeleted: 0 
    });
    
    if (!table) {
      return res.status(404).json({ 
        success: false,
        message: "ไม่พบโต๊ะนี้" 
      });
    }
    
    // Soft delete
    table.isDeleted = 1;
    await table.save();
    
    res.json({
      success: true,
      message: "ลบโต๊ะสำเร็จ"
    });
  } catch (error) {
    console.error("Delete table error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการลบโต๊ะ" 
    });
  }
};
