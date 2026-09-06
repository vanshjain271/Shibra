import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Button from '../../components/ui/Button';

const { width } = Dimensions.get('window');

const WelcomeScreen: React.FC<AuthStackScreenProps<'Welcome'>> = ({ navigation }) => {
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <View style={styles.content}>
        {/* Branding Area */}
        <View style={styles.brandContainer}>
          <Image 
            source={require('../../assets/images/logo_round.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <Text style={styles.subtitle}>Premium Mobile Accessories</Text>
          <View style={styles.accentBar} />
        </View>

        {/* Action Area */}
        <View style={styles.actionContainer}>
          <Text style={styles.welcomeText}>Welcome to the exclusive community of innovative seekers.</Text>
          
          <Button
            title="SIGN IN"
            variant="primary"
            size="large"
            onPress={handleLogin}
            style={styles.button}
            textStyle={styles.buttonText}
          />
          
          <Button
            title="CREATE ACCOUNT"
            variant="outline"
            size="large"
            onPress={handleRegister}
            style={styles.button}
            textStyle={styles.buttonText}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>By continuing, you agree to our Terms and Privacy Policy</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxl,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
  },
  accentBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.lg,
    borderRadius: 2,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  actionContainer: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  button: {
    marginBottom: SPACING.md,
    height: 56,
  },
  buttonText: {
    letterSpacing: 1,
    fontWeight: '700',
  },
  footer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default WelcomeScreen;
