import React, { useState, useEffect } from 'react';
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
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { 
  verticalScale, 
  moderateScale, 
  getFontSize, 
  getSpacing, 
  getBorderRadius,
  getButtonHeight 
} from '../utils/responsive';

export default function LoginScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn, setUser, setProfile, setIsDemoUser } = useAuth();

  // Check if coming from successful registration
  useEffect(() => {
    if (route.params?.registrationSuccess) {
      const { userName, userEmail, needsEmailConfirmation } = route.params;
      
      if (needsEmailConfirmation) {
        setSuccessMessage({
          type: 'email',
          message: `✉️ Check your email! We sent a confirmation link to ${userEmail}`,
        });
      } else {
        setSuccessMessage({
          type: 'success',
          message: `🎉 Welcome ${userName}! Account created successfully. You can now sign in.`,
        });
      }

      // Auto-fill email
      setEmail(userEmail || '');

      // Clear the params to prevent showing message again
      navigation.setParams({ registrationSuccess: false });

      // Hide message after 8 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 8000);
    }
  }, [route.params]);

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    // Enhanced validation
    if (!sanitizedEmail || !sanitizedPassword) {
      if (!sanitizedEmail) setEmailError('Email is required');
      if (!sanitizedPassword) setPasswordError('Password is required');
      return;
    }

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('[LoginScreen] Starting login process...');
      console.log('[LoginScreen] Email:', sanitizedEmail);
      
      const loginResult = await signIn(sanitizedEmail, sanitizedPassword);
      
      console.log('[LoginScreen] Login result:', JSON.stringify(loginResult, null, 2));
      
      if (loginResult?.error) {
        const errorMsg = loginResult.error.message || 'Login failed';
        console.error('[LoginScreen] Login error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!loginResult?.data?.user) {
        console.error('[LoginScreen] No user data in response');
        throw new Error('Login failed - no user data returned');
      }
      
      console.log('[LoginScreen] ✓ Login successful!');
      setIsDemoUser(false); // Reset demo flag for real user
      setLoading(false);
      // Login successful - navigation will be handled automatically by AppNavigator
      // Don't navigate manually - let the auth state change trigger the stack switch

    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message.includes('Email not confirmed')) {
          setEmailError('Please confirm your email first');
        errorMessage = 'Please check your email and confirm your account before logging in.';
        } else if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid')) {
          setPasswordError('Invalid email or password');
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('not found') || error.message.includes('User not found')) {
          setEmailError('Account not found');
        errorMessage = 'No account found with this email. Please check your email or create a new account.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
      }
      
      Alert.alert('Login Failed', errorMessage);
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
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.title}>Sign In</Text>
              <Text style={styles.subtitle}>Enter your email and password</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, emailError && styles.inputError]}
                  placeholder="22235103255@cse.bubt.edu.bd"
                  placeholderTextColor={emailError ? '#EF4444' : '#999999'}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, passwordError && styles.inputError]}
                    placeholder="Enter your password"
                    placeholderTextColor={passwordError ? '#EF4444' : '#999999'}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              <TouchableOpacity 
                style={styles.forgotPassword} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Demo Button */}
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => {
                  // Set demo user in AuthContext
                  const demoUser = {
                    id: 'demo-user-123',
                    email: 'demo@bubt.edu.bd',
                    user_metadata: {
                      full_name: 'Demo User',
                      student_id: '12345678901',
                      department: 'Computer Science',
                      batch: '2023'
                    }
                  };
                  const demoProfile = {
                    id: 'demo-user-123',
                    full_name: 'Demo User',
                    student_id: '12345678901',
                    department: 'Computer Science',
                    batch: '2023',
                    phone: '+8801234567890',
                    bio: 'This is a demo profile for testing CampusLink features.',
                    avatar_url: null
                  };
                  
                  setUser(demoUser);
                  setProfile(demoProfile);
                  setIsDemoUser(true);
                  navigation.navigate('Feed');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.demoButtonText}>Continue as Demo</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Success Message Banner */}
            {successMessage && (
              <View style={[
                styles.successBanner,
                successMessage.type === 'email' ? styles.emailBanner : styles.greenBanner
              ]}>
                <Text style={styles.successBannerText}>{successMessage.message}</Text>
              </View>
            )}
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
    marginBottom: verticalScale(36),
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(24),
  },
  checkIcon: {
    fontSize: getFontSize(48),
    color: '#10B981',
    fontWeight: 'bold',
  },
  title: {
    fontSize: getFontSize(36),
    fontWeight: '800',
    color: '#000000',
    marginBottom: verticalScale(10),
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
    marginBottom: verticalScale(20),
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
    paddingVertical: getSpacing(15),
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
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: getBorderRadius(16),
    height: getButtonHeight(52),
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: getSpacing(18),
    paddingVertical: getSpacing(15),
    fontSize: getFontSize(16),
    color: '#1A1A1A',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  eyeButton: {
    padding: getSpacing(16),
  },
  eyeIcon: {
    fontSize: getFontSize(22),
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: verticalScale(28),
    marginTop: verticalScale(4),
  },
  forgotPasswordText: {
    color: '#6C63FF',
    fontSize: getFontSize(15),
    fontWeight: '600',
    letterSpacing: 0,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
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
  demoButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6C63FF',
    paddingVertical: getButtonHeight(16),
    borderRadius: getBorderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getSpacing(12),
    minHeight: getButtonHeight(48),
  },
  demoButtonText: {
    color: '#6C63FF',
    fontSize: getFontSize(16),
    fontWeight: '600',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
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
  successBanner: {
    marginTop: verticalScale(24),
    paddingVertical: verticalScale(16),
    paddingHorizontal: getSpacing(20),
    borderRadius: getBorderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  greenBanner: {
    backgroundColor: '#10B981',
  },
  emailBanner: {
    backgroundColor: '#3B82F6',
  },
  successBannerText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: verticalScale(20),
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  demoBanner: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: getSpacing(16),
    paddingVertical: getSpacing(12),
    borderRadius: getBorderRadius(12),
    marginHorizontal: getSpacing(20),
    marginTop: getSpacing(16),
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  demoBannerText: {
    fontSize: getFontSize(13),
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: verticalScale(18),
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
});
