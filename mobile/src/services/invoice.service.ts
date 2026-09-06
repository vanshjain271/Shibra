/**
 * Invoice Service
 * 
 * Handles invoice PDF viewing and downloading
 * Uses react-native-pdf and react-native-fs
 */

import { Alert, Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

export interface DownloadProgress {
  bytesWritten: number;
  contentLength: number;
  progress: number;
}

class InvoiceService {
  /**
   * Download invoice PDF to device
   * 
   * @param pdfUrl PDF URL
   * @param invoiceNumber Invoice number for filename
   * @param onProgress Progress callback
   */
  async downloadInvoice(
    pdfUrl: string,
    invoiceNumber: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Request storage permission on Android
      if (Platform.OS === 'android') {
        const granted = await this.requestStoragePermission();
        if (!granted) {
          return {
            success: false,
            error: 'Storage permission denied',
          };
        }
      }

      // Generate file path
      const fileName = `${invoiceNumber}.pdf`;
      const downloadDir =
        Platform.OS === 'android'
          ? RNFS.DownloadDirectoryPath
          : RNFS.DocumentDirectoryPath;
      const filePath = `${downloadDir}/${fileName}`;

      // Download file
      const download = RNFS.downloadFile({
        fromUrl: pdfUrl,
        toFile: filePath,
        progress: (res) => {
          if (onProgress) {
            onProgress({
              bytesWritten: res.bytesWritten,
              contentLength: res.contentLength,
              progress: res.bytesWritten / res.contentLength,
            });
          }
        },
      });

      const result = await download.promise;

      if (result.statusCode === 200) {
        return {
          success: true,
          filePath,
        };
      } else {
        return {
          success: false,
          error: 'Download failed',
        };
      }
    } catch (error: any) {
      console.error('Invoice Download Error:', error);
      return {
        success: false,
        error: error.message || 'Download failed',
      };
    }
  }

  /**
   * Share invoice PDF
   * 
   * @param pdfUrl PDF URL
   * @param invoiceNumber Invoice number
   */
  async shareInvoice(
    pdfUrl: string,
    invoiceNumber: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Download first
      const downloadResult = await this.downloadInvoice(pdfUrl, invoiceNumber);

      if (!downloadResult.success || !downloadResult.filePath) {
        return {
          success: false,
          error: downloadResult.error || 'Download failed',
        };
      }

      // Share file
      await Share.open({
        url: `file://${downloadResult.filePath}`,
        type: 'application/pdf',
        title: `Invoice ${invoiceNumber}`,
        subject: `Invoice ${invoiceNumber}`,
        message: `Invoice ${invoiceNumber}`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Invoice Share Error:', error);

      // User cancelled share
      if (error.message === 'User did not share') {
        return { success: true };
      }

      return {
        success: false,
        error: error.message || 'Share failed',
      };
    }
  }

  /**
   * Open invoice in external PDF viewer
   * 
   * @param filePath Local file path
   */
  async openInExternalViewer(filePath: string): Promise<void> {
    try {
      await Share.open({
        url: `file://${filePath}`,
        type: 'application/pdf',
      });
    } catch (error: any) {
      console.error('Open External Viewer Error:', error);
      Alert.alert('Error', 'Failed to open invoice', [{ text: 'OK' }]);
    }
  }

  /**
   * Delete downloaded invoice
   * 
   * @param filePath Local file path
   */
  async deleteInvoice(filePath: string): Promise<boolean> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Invoice Delete Error:', error);
      return false;
    }
  }

  /**
   * Check if invoice is already downloaded
   * 
   * @param invoiceNumber Invoice number
   */
  async isInvoiceDownloaded(invoiceNumber: string): Promise<{ downloaded: boolean; filePath?: string }> {
    try {
      const fileName = `${invoiceNumber}.pdf`;
      const downloadDir =
        Platform.OS === 'android'
          ? RNFS.DownloadDirectoryPath
          : RNFS.DocumentDirectoryPath;
      const filePath = `${downloadDir}/${fileName}`;

      const exists = await RNFS.exists(filePath);

      return {
        downloaded: exists,
        filePath: exists ? filePath : undefined,
      };
    } catch (error) {
      console.error('Check Invoice Error:', error);
      return { downloaded: false };
    }
  }

  /**
   * Request storage permission (Android only)
   */
  private async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      // Android 13+ uses different permission
      if (Platform.Version >= 33) {
        return true; // No permission needed for scoped storage
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to your storage to download invoices.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Storage Permission Error:', error);
      return false;
    }
  }

  /**
   * Get download directory path
   */
  getDownloadDirectory(): string {
    return Platform.OS === 'android'
      ? RNFS.DownloadDirectoryPath
      : RNFS.DocumentDirectoryPath;
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default new InvoiceService();
