/**
 * InvoiceViewer Screen
 * 
 * View and download PDF invoices
 * Uses react-native-pdf for viewing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
let Pdf: any = null;
/*
try {
  Pdf = require('react-native-pdf').default;
} catch (e) {
  console.log('PDF viewer not available');
}
*/
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import invoiceService from '../../services/invoice.service';

type InvoiceViewerNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'InvoiceViewer'
>;
type InvoiceViewerRouteProp = RouteProp<RootStackParamList, 'InvoiceViewer'>;

interface InvoiceViewerProps {
  navigation: InvoiceViewerNavigationProp;
  route: InvoiceViewerRouteProp;
}

const InvoiceViewerScreen: React.FC<InvoiceViewerProps> = ({ navigation, route }) => {
  const { invoiceUrl, orderId } = route.params;
  const invoiceNumber = `INV-${orderId.slice(-8)}`;

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Ensure absolute URL
  const fullInvoiceUrl = invoiceUrl.startsWith('http') 
    ? invoiceUrl 
    : `https://api.shibra.in/api/v1${invoiceUrl.startsWith('/') ? '' : '/'}${invoiceUrl}`;

  const handleDownload = async () => {
    setLoading(true);
    setProgress(0);

    const result = await invoiceService.downloadInvoice(
      fullInvoiceUrl,
      invoiceNumber,
      (progressData) => {
        setProgress(progressData.progress);
      }
    );

    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Success',
        `Invoice saved to ${invoiceService.getDownloadDirectory()}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to download invoice', [{ text: 'OK' }]);
    }
  };

  const handleShare = async () => {
    setLoading(true);

    const result = await invoiceService.shareInvoice(fullInvoiceUrl, invoiceNumber);

    setLoading(false);

    if (!result.success && result.error) {
      Alert.alert('Error', result.error, [{ text: 'OK' }]);
    }
  };

  return (
    <View style={styles.container}>
      {/* PDF Viewer */}
      {!Pdf ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>PDF Viewer not available on this device.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleDownload}>
            <Text style={styles.retryText}>Download instead</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Pdf
          trustAllCerts={false}
          source={{ uri: fullInvoiceUrl, cache: true }}
          onLoadComplete={(numberOfPages: number, filePath: string) => {
            console.log(`Number of pages: ${numberOfPages}`);
          }}
          onPageChanged={(page: number, numberOfPages: number) => {
            console.log(`Current page: ${page}`);
          }}
          onError={(error: any) => {
            console.log('PDF Error:', error);
            setError('Failed to load PDF. Please try downloading it.');
          }}
          onPressLink={(uri: string) => {
            console.log(`Link pressed: ${uri}`);
          }}
          style={styles.pdf}
        />
      )}

      {/* Loading Indicator */}
      {(loading || progress < 1) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {loading ? 'Processing...' : `Loading ${Math.round(progress * 100)}%`}
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setProgress(0);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDownload}
          disabled={loading}
        >
          <Text style={styles.actionIcon}>⬇️</Text>
          <Text style={styles.actionText}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
          disabled={loading}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pdf: {
    flex: 1,
    backgroundColor: COLORS.borderLight,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.radius.md,
  },
  retryText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    backgroundColor: COLORS.borderLight,
    borderRadius: SPACING.radius.md,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
  },
});

export default InvoiceViewerScreen;
