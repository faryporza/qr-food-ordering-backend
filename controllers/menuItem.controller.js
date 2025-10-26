import MenuItem from '../models/MenuItem.js';
import cloudinary from '../config/cloudinary.js';

// Get all menu items
export const getAllMenuItems = async (req, res) => {
  try {
    const { includeHidden, categoryId } = req.query;
    const user = req.user;

    let query = { isDeleted: 0 };

    // Filter by category if provided
    if (categoryId) {
      query.category = categoryId;
    }

    // Only admin and employee can see hidden items
    if (!includeHidden || !user || (user.role !== 'admin' && user.role !== 'employee')) {
      query.isVisible = true;
    }

    const menuItems = await MenuItem.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเมนู',
    });
  }
};

// Get menu item by ID
export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findOne({
      _id: id,
      isDeleted: 0,
    }).populate('category', 'name');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบเมนูนี้',
      });
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error('Get menu item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเมนู',
    });
  }
};

// Create new menu item (Admin only)
export const createMenuItem = async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์สร้างเมนู (admin เท่านั้น)',
      });
    }

    const { name, category, price, description, image, isVisible } = req.body;

    const menuItem = await MenuItem.create({
      name,
      category,
      price,
      description,
      image,
      isVisible,
    });

    const populatedMenuItem = await MenuItem.findById(menuItem._id).populate(
      'category',
      'name'
    );

    res.status(201).json({
      success: true,
      message: 'สร้างเมนูสำเร็จ',
      data: populatedMenuItem,
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการสร้างเมนู',
    });
  }
};

// Update menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updateData = {};

    // Admin can update everything except _id and timestamps
    if (user.role === 'admin') {
      const { name, category, price, description, image, isVisible } = req.body;
      if (name !== undefined) updateData.name = name;
      if (category !== undefined) updateData.category = category;
      if (price !== undefined) updateData.price = price;
      if (description !== undefined) updateData.description = description;
      if (image !== undefined) updateData.image = image;
      if (isVisible !== undefined) updateData.isVisible = isVisible;
    }
    // Employee can only update isVisible
    else if (user.role === 'employee') {
      const { isVisible } = req.body;
      if (isVisible !== undefined) updateData.isVisible = isVisible;
      if (isVisible !== undefined) updateData.isVisible = isVisible;
    } else {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขเมนู',
      });
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: id, isDeleted: 0 },
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบเมนูนี้',
      });
    }

    res.json({
      success: true,
      message: 'อัพเดทเมนูสำเร็จ',
      data: menuItem,
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัพเดทเมนู',
    });
  }
};

// Toggle visibility (Admin and Employee)
export const toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check permission
    if (user.role !== 'admin' && user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขสถานะการแสดงผล',
      });
    }

    const menuItem = await MenuItem.findOne({ _id: id, isDeleted: 0 });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบเมนูนี้',
      });
    }

    menuItem.isVisible = !menuItem.isVisible;
    await menuItem.save();

    const populatedMenuItem = await MenuItem.findById(menuItem._id).populate(
      'category',
      'name'
    );

    res.json({
      success: true,
      message: `${menuItem.isVisible ? 'แสดง' : 'ซ่อน'}เมนูแล้ว`,
      data: populatedMenuItem,
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ',
    });
  }
};

// Delete menu item (Soft delete - Admin only)
export const deleteMenuItem = async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ลบเมนู (admin เท่านั้น)',
      });
    }

    const { id } = req.params;

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: id, isDeleted: 0 },
      { isDeleted: 1 },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบเมนูนี้',
      });
    }

    res.json({
      success: true,
      message: 'ลบเมนูสำเร็จ',
      data: menuItem,
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบเมนู',
    });
  }
};

// Upload image to Cloudinary
export const uploadImage = async (req, res) => {
  try {
    // Check permission (admin only)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์อัปโหลดรูปภาพ (admin เท่านั้น)',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกไฟล์รูปภาพ',
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'qr-food-ordering/menu-items',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      message: 'อัปโหลดรูปภาพสำเร็จ',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ',
    });
  }
};
