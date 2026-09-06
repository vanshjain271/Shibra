/**
 * Product Import Service
 * 
 * Handles bulk product import from CSV/Excel files
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

/**
 * Parse CSV content to product objects
 */
const parseCSV = (csvContent) => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const products = [];

    // Required columns
    const requiredColumns = ['name', 'sku', 'saleprice', 'mrp', 'category'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const product = {};
        headers.forEach((header, index) => {
            product[header] = values[index]?.trim() || '';
        });

        products.push({
            name: product.name,
            sku: product.sku,
            description: product.description || '',
            salePrice: parseFloat(product.saleprice) || 0,
            mrp: parseFloat(product.mrp) || 0,
            costPrice: parseFloat(product.costprice) || 0,
            stock: parseInt(product.stock) || 0,
            minOrderQty: parseInt(product.minorderqty) || 1,
            maxOrderQty: parseInt(product.maxorderqty) || 0,
            lowStockThreshold: parseInt(product.lowstockthreshold) || 10,
            unit: product.unit || 'Pcs',
            hsnCode: product.hsncode || '',
            taxRate: parseFloat(product.taxrate) || 0,
            categoryName: product.category,
            brandName: product.brand || '',
            isActive: product.isactive?.toLowerCase() !== 'false',
            rowNumber: i + 1
        });
    }

    return products;
};

/**
 * Parse a single CSV line handling quoted values
 */
const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
};

/**
 * Import products from parsed data
 */
const importProducts = async (productsData) => {
    const results = {
        success: [],
        errors: [],
        created: 0,
        updated: 0,
        failed: 0
    };

    // Get or create categories and brands first
    const categoryMap = new Map();
    const brandMap = new Map();

    // Collect unique category and brand names
    const categoryNames = [...new Set(productsData.map(p => p.categoryName).filter(Boolean))];
    const brandNames = [...new Set(productsData.map(p => p.brandName).filter(Boolean))];

    // Find/create categories
    for (const name of categoryNames) {
        let category = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (!category) {
            category = await Category.create({ name, slug: name.toLowerCase().replace(/\s+/g, '-') });
        }
        categoryMap.set(name.toLowerCase(), category._id);
    }

    // Find/create brands
    for (const name of brandNames) {
        let brand = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (!brand) {
            brand = await Brand.create({ name, slug: name.toLowerCase().replace(/\s+/g, '-') });
        }
        brandMap.set(name.toLowerCase(), brand._id);
    }

    // Process each product
    for (const data of productsData) {
        try {
            const categoryId = categoryMap.get(data.categoryName.toLowerCase());
            if (!categoryId) {
                throw new Error(`Category "${data.categoryName}" not found`);
            }

            const productData = {
                name: data.name,
                sku: data.sku,
                description: data.description,
                salePrice: data.salePrice,
                mrp: data.mrp,
                costPrice: data.costPrice,
                stock: data.stock,
                minOrderQty: data.minOrderQty,
                maxOrderQty: data.maxOrderQty,
                lowStockThreshold: data.lowStockThreshold,
                unit: data.unit,
                hsnCode: data.hsnCode,
                taxRate: data.taxRate,
                category: categoryId,
                isActive: data.isActive
            };

            if (data.brandName) {
                const brandId = brandMap.get(data.brandName.toLowerCase());
                if (brandId) productData.brand = brandId;
            }

            // Check if product with SKU exists
            const existingProduct = data.sku ? await Product.findOne({ sku: data.sku }) : null;

            if (existingProduct) {
                // Update existing
                await Product.findByIdAndUpdate(existingProduct._id, productData);
                results.updated++;
                results.success.push({ row: data.rowNumber, sku: data.sku, action: 'updated' });
            } else {
                // Create new
                await Product.create(productData);
                results.created++;
                results.success.push({ row: data.rowNumber, sku: data.sku, action: 'created' });
            }
        } catch (error) {
            results.failed++;
            results.errors.push({
                row: data.rowNumber,
                sku: data.sku,
                error: error.message
            });
        }
    }

    return results;
};

/**
 * Generate sample CSV template
 */
const generateCSVTemplate = () => {
    const headers = [
        'name', 'sku', 'description', 'salePrice', 'mrp', 'costPrice',
        'stock', 'minOrderQty', 'maxOrderQty', 'lowStockThreshold',
        'unit', 'hsnCode', 'taxRate', 'category', 'brand', 'isActive'
    ];

    const sampleRow = [
        'Sample Product', 'PROD001', 'Product description', '999', '1299', '750',
        '100', '1', '0', '10', 'Pcs', '85044090', '18', 'Electronics', 'Samsung', 'true'
    ];

    return headers.join(',') + '\n' + sampleRow.join(',');
};

module.exports = {
    parseCSV,
    importProducts,
    generateCSVTemplate
};
