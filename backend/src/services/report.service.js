/**
 * Report Service - MVP
 * 
 * Generate business reports
 * - Product-wise order reports
 * - CSV export
 * - XLSX export
 * - Date range filtering
 */

const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const Order = require('../models/Order');
const Product = require('../models/Product');

class ReportService {
  /**
   * Generate product report
   * All orders containing the specified product
   */
  async generateProductReport(productId, options = {}) {
    try {
      const { dateFrom, dateTo, status } = options;

      // Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      // Build query
      const query = {
        'items.product': productId,
        status: { $in: ['PAID', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] }
      };

      if (status) {
        query.status = status;
      }

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      // Fetch orders
      const orders = await Order.find(query)
        .populate('user', 'name phone')
        .populate('invoice', 'invoiceNumber invoiceDate')
        .sort({ createdAt: -1 })
        .lean();

      // Process report data
      const reportData = [];

      for (const order of orders) {
        // Find items matching the product
        const productItems = order.items.filter(
          item => item.product.toString() === productId.toString()
        );

        for (const item of productItems) {
          reportData.push({
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            orderDate: this._formatDate(order.createdAt),
            orderStatus: order.status,
            invoiceNumber: order.invoice?.invoiceNumber || 'N/A',
            invoiceDate: order.invoice?.invoiceDate 
              ? this._formatDate(order.invoice.invoiceDate) 
              : 'N/A',
            customerName: order.user?.name || 'N/A',
            customerPhone: order.user?.phone || 'N/A',
            productName: item.name,
            variantName: item.variantName || 'N/A',
            sku: item.sku || 'N/A',
            quantity: item.quantity,
            price: item.price,
            mrp: item.mrp,
            itemTotal: item.total,
            orderTotal: order.totalAmount
          });
        }
      }

      // Calculate summary
      const summary = {
        totalOrders: orders.length,
        totalQuantitySold: reportData.reduce((sum, item) => sum + item.quantity, 0),
        totalRevenue: reportData.reduce((sum, item) => sum + item.itemTotal, 0)
      };

      return {
        success: true,
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku
        },
        dateRange: {
          from: dateFrom || null,
          to: dateTo || null
        },
        summary,
        data: reportData
      };
    } catch (error) {
      console.error('Generate Product Report Error:', error);
      return {
        success: false,
        message: 'Failed to generate product report'
      };
    }
  }

  /**
   * Generate sales report
   * All orders in date range
   */
  async generateSalesReport(options = {}) {
    try {
      const { dateFrom, dateTo, status } = options;

      // Build query
      const query = {
        status: { $in: ['PAID', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] }
      };

      if (status) {
        query.status = status;
      }

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      // Fetch orders
      const orders = await Order.find(query)
        .populate('user', 'name phone')
        .populate('invoice', 'invoiceNumber')
        .sort({ createdAt: -1 })
        .lean();

      // Process report data
      const reportData = orders.map(order => ({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        orderDate: this._formatDate(order.createdAt),
        orderStatus: order.status,
        invoiceNumber: order.invoice?.invoiceNumber || 'N/A',
        customerName: order.user?.name || 'N/A',
        customerPhone: order.user?.phone || 'N/A',
        itemCount: order.items.length,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
        paymentMode: order.payment.mode,
        amountPaid: order.payment.amountPaid,
        codAmount: order.payment.codAmount,
        codCollected: order.payment.codCollected ? 'Yes' : 'No'
      }));

      // Calculate summary
      const summary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        totalItemsSold: orders.reduce((sum, order) => sum + order.items.length, 0)
      };

      return {
        success: true,
        dateRange: {
          from: dateFrom || null,
          to: dateTo || null
        },
        summary,
        data: reportData
      };
    } catch (error) {
      console.error('Generate Sales Report Error:', error);
      return {
        success: false,
        message: 'Failed to generate sales report'
      };
    }
  }

  /**
   * Export to CSV
   */
  async exportToCSV(data, filename = 'report') {
    try {
      if (!data || data.length === 0) {
        return {
          success: false,
          message: 'No data to export'
        };
      }

      const parser = new Parser();
      const csv = parser.parse(data);

      return {
        success: true,
        csv,
        filename: `${filename}.csv`,
        contentType: 'text/csv'
      };
    } catch (error) {
      console.error('Export to CSV Error:', error);
      return {
        success: false,
        message: 'Failed to export to CSV'
      };
    }
  }

  /**
   * Export to XLSX
   */
  async exportToXLSX(data, filename = 'report', sheetName = 'Report') {
    try {
      if (!data || data.length === 0) {
        return {
          success: false,
          message: 'No data to export'
        };
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // Get column headers from first data object
      const headers = Object.keys(data[0]);

      // Add header row with styling
      worksheet.columns = headers.map(header => ({
        header: this._formatHeaderName(header),
        key: header,
        width: 15
      }));

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(row);
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const length = cell.value ? cell.value.toString().length : 0;
          if (length > maxLength) {
            maxLength = length;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return {
        success: true,
        buffer,
        filename: `${filename}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    } catch (error) {
      console.error('Export to XLSX Error:', error);
      return {
        success: false,
        message: 'Failed to export to XLSX'
      };
    }
  }

  /**
   * Generate inventory report
   */
  async generateInventoryReport() {
    try {
      const products = await Product.find()
        .select('name sku category variants stock salePrice')
        .populate('category', 'name')
        .lean();

      const reportData = [];

      for (const product of products) {
        if (product.hasVariants && product.variants.length > 0) {
          // Add each variant as separate row
          for (const variant of product.variants) {
            if (variant.isActive) {
              reportData.push({
                productName: product.name,
                variant: variant.name,
                sku: variant.sku,
                category: product.category?.name || 'N/A',
                brand: product.brand?.name || 'N/A',
                stock: variant.stock,
                salePrice: variant.salePrice,
                mrp: variant.mrp,
                status: variant.stock > 0 ? 'In Stock' : 'Out of Stock'
              });
            }
          }
        } else {
          // Add base product
          reportData.push({
            productName: product.name,
            variant: 'N/A',
            sku: product.sku || 'N/A',
            category: product.category?.name || 'N/A',
            brand: product.brand?.name || 'N/A',
            stock: product.stock,
            salePrice: product.salePrice,
            mrp: product.mrp,
            status: product.stock > 0 ? 'In Stock' : 'Out of Stock'
          });
        }
      }

      // Calculate summary
      const summary = {
        totalProducts: products.length,
        totalSKUs: reportData.length,
        inStock: reportData.filter(item => item.stock > 0).length,
        outOfStock: reportData.filter(item => item.stock === 0).length,
        totalInventoryValue: reportData.reduce((sum, item) => sum + (item.stock * item.salePrice), 0)
      };

      return {
        success: true,
        summary,
        data: reportData
      };
    } catch (error) {
      console.error('Generate Inventory Report Error:', error);
      return {
        success: false,
        message: 'Failed to generate inventory report'
      };
    }
  }

  /**
   * Internal: Format date
   */
  _formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Internal: Format header name
   */
  _formatHeaderName(header) {
    return header
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

module.exports = new ReportService();