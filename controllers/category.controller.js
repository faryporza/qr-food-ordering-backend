import Category from "../models/Category.js";

// Get all categories (not deleted)
export const getAllCategories = async (req, res) => {
  try {
    const { includeHidden } = req.query;
    
    const filter = { isDeleted: 0 };
    
    // Only show visible categories unless includeHidden is true
    if (includeHidden !== 'true') {
      filter.isVisible = true;
    }
    
    const categories = await Category.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error("Get all categories error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" 
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findOne({ 
      _id: id, 
      isDeleted: 0 
    });
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "ไม่พบหมวดหมู่นี้" 
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error("Get category by ID error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" 
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, isVisible } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: "กรุณาระบุชื่อหมวดหมู่" 
      });
    }
    
    // Check if category name already exists
    const existingCategory = await Category.findOne({ 
      name: name.trim(), 
      isDeleted: 0 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false,
        message: "มีหมวดหมู่นี้อยู่แล้ว" 
      });
    }
    
    // Create new category
    const category = new Category({
      name: name.trim(),
      isVisible: isVisible !== undefined ? isVisible : true
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      message: "สร้างหมวดหมู่สำเร็จ",
      data: category
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่" 
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isVisible } = req.body;
    
    const category = await Category.findOne({ 
      _id: id, 
      isDeleted: 0 
    });
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "ไม่พบหมวดหมู่นี้" 
      });
    }
    
    // Check if new name conflicts with existing category
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: name.trim(), 
        isDeleted: 0,
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          success: false,
          message: "มีหมวดหมู่ชื่อนี้อยู่แล้ว" 
        });
      }
      
      category.name = name.trim();
    }
    
    if (isVisible !== undefined) {
      category.isVisible = isVisible;
    }
    
    await category.save();
    
    res.json({
      success: true,
      message: "อัปเดตหมวดหมู่สำเร็จ",
      data: category
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่" 
    });
  }
};

// Soft delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findOne({ 
      _id: id, 
      isDeleted: 0 
    });
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "ไม่พบหมวดหมู่นี้" 
      });
    }
    
    // Soft delete
    category.isDeleted = 1;
    await category.save();
    
    res.json({
      success: true,
      message: "ลบหมวดหมู่สำเร็จ"
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการลบหมวดหมู่" 
    });
  }
};

// Toggle visibility
export const toggleCategoryVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findOne({ 
      _id: id, 
      isDeleted: 0 
    });
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "ไม่พบหมวดหมู่นี้" 
      });
    }
    
    category.isVisible = !category.isVisible;
    await category.save();
    
    res.json({
      success: true,
      message: `${category.isVisible ? 'แสดง' : 'ซ่อน'}หมวดหมู่สำเร็จ`,
      data: category
    });
  } catch (error) {
    console.error("Toggle category visibility error:", error);
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะการแสดงผล" 
    });
  }
};
