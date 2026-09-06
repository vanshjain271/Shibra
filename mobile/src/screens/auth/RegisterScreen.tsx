import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { sendOTP } from '../../store/slices/authSlice';

const RegisterScreen: React.FC<AuthStackScreenProps<'Register'>> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid Indian phone number';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Invalid pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      const resultAction = await dispatch(sendOTP(formData.phone));
      if (sendOTP.fulfilled.match(resultAction)) {
        navigation.navigate('VerifyOTP', {
          phoneNumber: formData.phone,
          isRegistration: true,
          registrationData: formData,
        });
      } else {
        Alert.alert('Error', (resultAction.payload as string) || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our exclusive seeker community</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="FULL NAME"
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              error={errors.name}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="MOBILE NUMBER"
              placeholder="10-digit number"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="ADDRESS LINE 1"
              placeholder="House, Street, Area"
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
              error={errors.address}
              containerStyle={styles.inputContainer}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Input
                  label="CITY"
                  placeholder="Your City"
                  value={formData.city}
                  onChangeText={(text) => updateField('city', text)}
                  error={errors.city}
                  containerStyle={styles.inputContainer}
                />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Input
                  label="STATE"
                  placeholder="Your State"
                  value={formData.state}
                  onChangeText={(text) => updateField('state', text)}
                  error={errors.state}
                  containerStyle={styles.inputContainer}
                />
              </View>
            </View>

            <Input
              label="PINCODE"
              placeholder="6-digit code"
              value={formData.pincode}
              onChangeText={(text) => updateField('pincode', text)}
              keyboardType="number-pad"
              maxLength={6}
              error={errors.pincode}
              containerStyle={styles.inputContainer}
            />

            <Button
              title="CONTINUE"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.button}
              textStyle={styles.buttonText}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    marginTop: SPACING.lg,
    height: 56,
  },
  buttonText: {
    letterSpacing: 2,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
});

export default RegisterScreen;
