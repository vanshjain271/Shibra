import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation.types';
import { useAppSelector } from '../../store/hooks';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PaymentQrScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PaymentQr'>;
};

const PaymentQrScreen: React.FC<PaymentQrScreenProps> = ({ navigation }) => {
  const { settings } = useAppSelector((state) => state.settings);
  const paymentQrCode = settings?.paymentQrCode;

  const handleShare = async () => {
    if (!paymentQrCode) return;
    try {
      await Share.share({
        message: `Scan this QR code to pay Shibra: ${paymentQrCode}`,
        url: paymentQrCode,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment QR Code</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Icon name="share-variant" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Scan & Pay via UPI</Text>
          <Text style={styles.qrSubtitle}>Secure Payment to Shibra Enterprise</Text>
          
          <View style={styles.qrContainer}>
            {paymentQrCode ? (
              <FastImage
                source={{ uri: paymentQrCode }}
                style={styles.qrImage}
                resizeMode={FastImage.resizeMode.contain}
              />
            ) : (
              <View style={styles.noQrContainer}>
                <Icon name="qrcode-remove" size={64} color={COLORS.textMuted} />
                <Text style={styles.noQrText}>QR Code not available</Text>
                <Text style={styles.noQrSubtext}>Please contact support or try again later</Text>
              </View>
            )}
          </View>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Icon name="shield-check" size={20} color={COLORS.success} />
              <Text style={styles.infoText}>Verified Merchant Account</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="lightning-bolt" size={20} color="#F59E0B" />
              <Text style={styles.infoText}>Instant Payment Confirmation</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instrTitle}>How to pay?</Text>
          <View style={styles.instrLine}>
            <View style={styles.instrDot} />
            <Text style={styles.instrText}>Take a screenshot of this QR code</Text>
          </View>
          <View style={styles.instrLine}>
            <View style={styles.instrDot} />
            <Text style={styles.instrText}>Open any UPI app (GPay, PhonePe, Paytm)</Text>
          </View>
          <View style={styles.instrLine}>
            <View style={styles.instrDot} />
            <Text style={styles.instrText}>Select 'Scan QR' and choose the screenshot</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          After payment, please share the screenshot on WhatsApp for confirmation.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  shareButton: {
    padding: 4,
  },
  content: {
    flexGrow: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  qrCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  qrTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  qrContainer: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 10,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  noQrContainer: {
    alignItems: 'center',
  },
  noQrText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  noQrSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  infoBox: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  instructions: {
    width: '100%',
    marginTop: 30,
    paddingHorizontal: 10,
  },
  instrTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: 12,
  },
  instrLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  instrDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  instrText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

export default PaymentQrScreen;
