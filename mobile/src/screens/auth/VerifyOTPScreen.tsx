/**
 * VerifyOTP Screen
 * Fixed:
 * - styles.header used SPACING.xxxl for marginBottom — added xxxl to theme
 * - styles.title used TYPOGRAPHY.fontSize.xxxl — added to theme
 * - phoneNumber param: authSlice sendOTP/verifyOTP use 'phone' internally,
 *   this screen passes phoneNumber from route — kept consistent
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { verifyFirebaseOTP, sendOTP, updateProfile } from '../../store/slices/authSlice';
import { addAddress } from '../../store/slices/addressSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Button from '../../components/ui/Button';

type VerifyOTPScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'VerifyOTP'
>;
type VerifyOTPScreenRouteProp = RouteProp<AuthStackParamList, 'VerifyOTP'>;

interface VerifyOTPScreenProps {
  navigation: VerifyOTPScreenNavigationProp;
  route: VerifyOTPScreenRouteProp;
}

const OTP_LENGTH = 6;
const RESEND_TIMER = 30;

const VerifyOTPScreen: React.FC<VerifyOTPScreenProps> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const { phoneNumber, isRegistration, registrationData } = route.params;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (resendTimer > 0 && !canResend) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer, canResend]);

  const handleOtpChange = (value: string, index: number) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      }
      return;
    }

    if (cleaned.length === 1) {
      const newOtp = [...otp];
      newOtp[index] = cleaned;
      setOtp(newOtp);
      if (index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
        setActiveIndex(index + 1);
      } else {
        inputRefs.current[index]?.blur();
      }
    } else if (cleaned.length === OTP_LENGTH) {
      // Handle paste of full OTP
      const newOtp = cleaned.split('').slice(0, OTP_LENGTH);
      setOtp(newOtp);
      inputRefs.current[OTP_LENGTH - 1]?.blur();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      Alert.alert('Error', 'Please enter complete OTP', [{ text: 'OK' }]);
      return;
    }

    try {
      // Use Firebase OTP verification thunk
      const resultAction = await dispatch(
        verifyFirebaseOTP({ otp: otpString })
      );
      if (verifyFirebaseOTP.fulfilled.match(resultAction)) {
        // If this is a registration flow, save profile and address details
        if (isRegistration && registrationData) {
          try {
            // 1. Update Profile Name
            await dispatch(updateProfile({ name: registrationData.name }));
            
            // 2. Add Initial Address
            await dispatch(addAddress({
              name: registrationData.name,
              phone: registrationData.phone,
              addressLine1: registrationData.address,
              city: registrationData.city,
              state: registrationData.state,
              pincode: registrationData.pincode,
              isDefault: true,
            }));
          } catch (profileError) {
            console.error('Failed to save profile/address during registration:', profileError);
            // We don't block the user from entering the app even if this fails,
            // they can update it from profile later.
          }
        }
      } else if (verifyFirebaseOTP.rejected.match(resultAction)) {
        Alert.alert(
          'Verification Failed',
          (resultAction.payload as string) || 'Invalid OTP.',
          [{ text: 'OK' }]
        );
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        setActiveIndex(0);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during verification.');
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    try {
      const resultAction = await dispatch(sendOTP(phoneNumber));
      if (sendOTP.fulfilled.match(resultAction)) {
        Alert.alert('Success', 'OTP sent successfully', [{ text: 'OK' }]);
        setResendTimer(RESEND_TIMER);
        setCanResend(false);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        setActiveIndex(0);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>
            Enter the secure 6-digit code sent to {'\n'}
            <Text style={styles.phoneNumber}>+91 {phoneNumber}</Text>
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.changeNumber}>Edit Number</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                activeIndex === index && styles.otpInputActive,
                digit !== '' && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onFocus={() => setActiveIndex(index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              selectTextOnFocus
              autoFocus={index === 0}
              placeholderTextColor={COLORS.textSecondary}
            />
          ))}
        </View>

        <Button
          title="Verify & Continue"
          onPress={handleVerifyOTP}
          loading={isLoading}
          disabled={!isOtpComplete}
          fullWidth
          size="large"
          style={styles.verifyButton}
        />

        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Resend code in{' '}
              <Text style={styles.countdown}>{resendTimer}</Text> seconds
            </Text>
          )}
        </View>

        <Text style={styles.infoText}>
          If you didn't receive the SMS, please check your network or try again in a moment.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl, // FIX: was SPACING.xxxl which didn't exist; now xxxl added to theme too
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl, // FIX: now exists in theme
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  phoneNumber: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  changeNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  otpInput: {
    width: 50,
    height: 64,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SPACING.radius.lg,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    backgroundColor: COLORS.surface,
  },
  otpInputActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
  },
  verifyButton: {
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
  timerText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
  },
  countdown: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.xl,
  },
});

export default VerifyOTPScreen;