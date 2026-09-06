import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { sendOTP } from '../../store/slices/authSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!/^[6-9]/.test(cleaned)) {
      setPhoneError('Mobile number should start with 6, 7, 8, or 9');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhone(phoneNumber)) {
      return;
    }

    try {
      const cleaned = phoneNumber.replace(/\D/g, '');
      
      // Now uses Firebase Phone Auth under the hood
      const resultAction = await dispatch(sendOTP(cleaned));

      if (sendOTP.fulfilled.match(resultAction)) {
        // payload now contains the confirmationResult for the next screen
        navigation.navigate('VerifyOTP', { phoneNumber: cleaned });
      } else {
        const errorMessage = resultAction.payload as string || 'Failed to send OTP.';
        
        // Specific help for Firebase common issues
        if (errorMessage.includes('too-many-requests')) {
          Alert.alert('Too Many Attempts', 'Please try again later or use a different number.');
        } else if (errorMessage.includes('invalid-phone-number')) {
          setPhoneError('Invalid phone number format');
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(cleaned);
    if (phoneError) {
      setPhoneError('');
    }
  };

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
          <Image
            source={require('../../assets/images/logo_round.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number to receive a secure OTP and continue shopping.
          </Text>

          <Input
            label="Mobile Number"
            placeholder="Enter 10-digit mobile number"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            error={phoneError}
            keyboardType="number-pad"
            maxLength={10}
            required
            leftIcon={<Text style={styles.countryCode}>+91</Text>}
            autoFocus
          />

          <Button
            title="Send OTP"
            onPress={handleSendOTP}
            loading={isLoading}
            disabled={!phoneNumber || phoneNumber.length !== 10}
            fullWidth
            size="large"
            style={styles.sendButton}
          />

          <Text style={styles.infoText}>
            By continuing, you agree to our Terms of Service and Privacy Policy. Secure authentication provided by Shibra.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Need assistance?</Text>
          <Text style={styles.supportText}>support@shibra.com</Text>
        </View>
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
    marginBottom: SPACING.xxl,
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: SPACING.sm,
    backgroundColor: 'transparent',
  },
  form: {
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxh,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  countryCode: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
  },
  sendButton: {
    marginTop: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  supportText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
});

export default LoginScreen;
