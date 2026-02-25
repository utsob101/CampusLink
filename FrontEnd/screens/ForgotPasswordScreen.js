import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
// Password reset via email is not implemented in the backend yet.
import {
  verticalScale,
  moderateScale,
  getFontSize,
  getSpacing,
  getBorderRadius,
  getButtonHeight
} from '../utils/responsive';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    // Sanitize input
    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail) {
      Alert.alert('Error', 'Please enter your  email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Placeholder until backend implements reset email flow
      setEmailSent(true);
      setLoading(false);
      Alert.alert('Info', 'Password reset is not available yet. Please contact support or try again later.');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to process request. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Light Purple Background */}
      <View style={styles.background}>
        <View style={styles.purpleBase} />
        <View style={styles.purpleLayer1} />
        <View style={styles.purpleLayer2} />
        <View style={styles.purpleShape1} />
        <View style={styles.purpleShape2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔒</Text>
              </View>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your email and we'll send you instructions to reset your password
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="22235103255@cse.bubt.edu.bd"
                  placeholderTextColor="#999999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  editable={!emailSent}
                />
              </View>

              <TouchableOpacity
                style={[styles.resetButton, (loading || emailSent) && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                disabled={loading || emailSent}
                activeOpacity={0.85}
              >
                <View style={styles.btnShine} />
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.resetButtonText}>
                    {emailSent ? 'Email Sent!' : 'Send Reset Link'}
                  </Text>
                )}
              </TouchableOpacity>

              {emailSent && (
                <View style={styles.successMessage}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.successText}>
                    Check your email for password reset instructions
                  </Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  purpleBase: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F3FF',
  },
  purpleLayer1: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#EDE9FE',
    opacity: 0.8,
  },
  purpleLayer2: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#E9E5FF',
    opacity: 0.6,
  },
  purpleShape1: {
    position: 'absolute',
    width: '150%',
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: '#DDD6FE',
    opacity: 0.5,
    top: '-35%',
    right: '-25%',
  },
  purpleShape2: {
    position: 'absolute',
    width: '120%',
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: '#C4B5FD',
    opacity: 0.4,
    bottom: '-30%',
    left: '-20%',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: getSpacing(28),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + verticalScale(20) : verticalScale(50),
    paddingBottom: verticalScale(40),
  },
  backButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(32),
  },
  backButtonText: {
    fontSize: getFontSize(24),
    color: '#6C63FF',
    fontWeight: '600',
    marginTop: -2,
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(36),
  },
  iconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(24),
  },
  icon: {
    fontSize: getFontSize(40),
  },
  title: {
    fontSize: getFontSize(36),
    fontWeight: '800',
    color: '#000000',
    marginBottom: verticalScale(14),
    letterSpacing: -1.5,
    textAlign: 'center',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  subtitle: {
    fontSize: getFontSize(15),
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: verticalScale(22),
    paddingHorizontal: getSpacing(10),
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  form: {
    marginBottom: verticalScale(32),
  },
  inputContainer: {
    marginBottom: verticalScale(24),
  },
  label: {
    fontSize: getFontSize(15),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: verticalScale(10),
    letterSpacing: -0.2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: getBorderRadius(16),
    paddingHorizontal: getSpacing(18),
    paddingVertical: verticalScale(15),
    fontSize: getFontSize(16),
    color: '#1A1A1A',
    height: getButtonHeight(52),
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  resetButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: getButtonHeight(18),
    borderRadius: getBorderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: getButtonHeight(52),
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: getFontSize(17),
    fontWeight: '700',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  successMessage: {
    marginTop: verticalScale(24),
    padding: getSpacing(16),
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: getBorderRadius(16),
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: getFontSize(24),
    marginRight: getSpacing(12),
    color: '#10B981',
  },
  successText: {
    flex: 1,
    fontSize: getFontSize(14),
    fontWeight: '500',
    color: '#10B981',
    lineHeight: verticalScale(20),
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: getFontSize(15),
    color: '#666666',
    fontWeight: '500',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  footerLink: {
    fontSize: getFontSize(15),
    color: '#6C63FF',
    fontWeight: '700',
    letterSpacing: 0,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
});

