const Inquiry = require('../models/Inquiry');

const createInquiry = async (req, res) => {
  try {
    const { productId, name, phone, quantity } = req.body;
    
    if (!productId || !name || !phone || !quantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const inquiry = await Inquiry.create({
      product: productId,
      user: req.user ? req.user.id : undefined,
      name,
      phone,
      quantity
    });

    res.status(201).json({ success: true, inquiry });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate('product', 'name sku images salePrice mrp colors sizes attributes')
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, inquiries });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateInquiryStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    );
    
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    
    res.status(200).json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createInquiry,
  getInquiries,
  updateInquiryStatus
};
