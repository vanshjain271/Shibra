/**
 * Utils Index - MVP
 */

const gstUtil = require('./gst.util');
const pdfUtil = require('./pdf.util');

module.exports = {
  ...gstUtil,
  ...pdfUtil
};