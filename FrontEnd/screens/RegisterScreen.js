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

export default function RegisterScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states for real-time feedback
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const { signUp } = useAuth();

  const validatePassword = (pwd) => {
    // Check minimum length
    if (pwd.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(pwd)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    // Check for number
    if (!/\d/.test(pwd)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&* etc.)' };
    }

    // Check for common passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.some(common => pwd.toLowerCase().includes(common))) {
      return { valid: false, message: 'This password is too common. Please choose a stronger password' };
    }

    // Check for sequential characters
    for (let i = 0; i < pwd.length - 2; i++) {
      const char1 = pwd.charCodeAt(i);
      const char2 = pwd.charCodeAt(i + 1);
      const char3 = pwd.charCodeAt(i + 2);
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return { valid: false, message: 'Avoid using sequential characters in your password' };
      }
    }

    return { valid: true, message: '' };
  };

  const handleRegister = async () => {
    // Clear previous errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Sanitize inputs
    const sanitizedFullName = fullName.trim().replace(/\s+/g, ' ');
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();
    const sanitizedConfirmPassword = confirmPassword.trim();

    // Enhanced validation with detailed feedback
    if (!sanitizedFullName || !sanitizedEmail || !sanitizedPassword || !sanitizedConfirmPassword) {
      const msg = 'Please fill in all fields';
      Alert.alert('Error', msg);
      if (!sanitizedFullName) setNameError('Full name is required');
      if (!sanitizedEmail) setEmailError('Email is required');
      if (!sanitizedPassword) setPasswordError('Password is required');
      if (!sanitizedConfirmPassword) setConfirmPasswordError('Please confirm password');
      return;
    }

    // Enhanced name validation
    if (sanitizedFullName.length < 3) {
      const msg = 'Please enter your full name (minimum 3 characters)';
      setNameError(msg);
      Alert.alert('Invalid Name', msg);
      return;
    }

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      const msg = 'Please enter a valid email address';
      setEmailError(msg);
      Alert.alert('Invalid Email', msg);
      return;
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(sanitizedPassword);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message);
      Alert.alert('Invalid Password', passwordValidation.message);
      return;
    }

    // Enhanced password confirmation
    if (sanitizedPassword !== sanitizedConfirmPassword) {
      const msg = 'Passwords do not match';
      setConfirmPasswordError(msg);
      Alert.alert('Password Mismatch', msg);
      return;
    }

    setLoading(true);

    try {
      console.log('[RegisterScreen] Starting registration process...');
      console.log('[RegisterScreen] Email:', sanitizedEmail);
      console.log('[RegisterScreen] Full name:', sanitizedFullName);
      
      // Attempt registration
      const registrationResult = await signUp(sanitizedEmail, sanitizedPassword, {
        full_name: sanitizedFullName,
        student_id: sanitizedEmail.split('@')[0], // Use email prefix as student ID
        department: 'General', // Default department
        batch: new Date().getFullYear().toString(), // Current year as batch
      });
      
      console.log('[RegisterScreen] Registration result:', JSON.stringify(registrationResult, null, 2));
      
      if (registrationResult?.error) {
        const errorMsg = registrationResult.error.message || 'Registration failed';
        console.error('[RegisterScreen] Registration error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!registrationResult?.data?.user) {
        console.error('[RegisterScreen] No user data in response');
        throw new Error('Registration failed - no user data returned');
      }
      
      console.log('[RegisterScreen] ✓ Registration successful!');
      
      // Clear form fields
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Show success message and redirect to login
      Alert.alert(
        'Registration Successful!', 
        'Your account has been created. Please log in with your credentials.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );

    } catch (error) {
      console.error('[RegisterScreen] Registration error:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
        setEmailError('Email already registered');
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
        setEmailError('Invalid email format');
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long.';
        setPasswordError('Password too short');
      } else if (error.message.includes('Network error') || error.message.includes('cannot reach server')) {
        errorMessage = 'Cannot connect to server. Please ensure:\n\n1. The backend server is running (npm run dev in Backend folder)\n2. Your device/emulator can reach localhost:4000\n3. Your firewall is not blocking the connection';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Light Purple Background - Exact Clone of LoginScreen */}
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
                <Text style={styles.registerIcon}>📝</Text>
              </View>
              <Text style={styles.title}>Register Account</Text>
              <Text style={styles.subtitle}>Join CampusLink Community</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, nameError && styles.inputError]}
                  placeholder="Enter your full name"
                  placeholderTextColor={nameError ? '#EF4444' : '#999999'}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  selectionColor="#6C63FF"
                  outlineStyle="none"
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, emailError && styles.inputError]}
                  placeholder="22235103255@cse.bubt.edu.bd"
                  placeholderTextColor={emailError ? '#EF4444' : '#999999'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor="#6C63FF"
                  outlineStyle="none"
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, passwordError && styles.inputError]}
                    placeholder="Create a strong password"
                    placeholderTextColor={passwordError ? '#EF4444' : '#999999'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor="#6C63FF"
                    outlineStyle="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, confirmPasswordError && styles.inputError]}
                    placeholder="Confirm your password"
                    placeholderTextColor={confirmPasswordError ? '#EF4444' : '#999999'}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor="#6C63FF"
                    outlineStyle="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerButtonText}>Register Account</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginLink}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLinkText}>Sign In</Text>
                </TouchableOpacity>
              </View>
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
    paddingHorizontal: getSpacing(24),
    paddingTop: getSpacing(20),
    paddingBottom: getSpacing(40),
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
  registerIcon: {
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
    backgroundColor: 'rgba(254, 242, 242, 0.7)',
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
    paddingHorizontal: getSpacing(16),
    paddingVertical: getSpacing(14),
  },
  eyeText: {
    fontSize: getFontSize(14),
    color: '#6C63FF',
    fontWeight: '600',
  },
  errorText: {
    fontSize: getFontSize(14),
    color: '#EF4444',
    marginTop: getSpacing(4),
  },
  registerButton: {
    backgroundColor: '#6C63FF',
    borderRadius: getBorderRadius(16),
    paddingVertical: getSpacing(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getSpacing(8),
    marginBottom: getSpacing(24),
    height: getButtonHeight(52),
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#FFFFFF',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: getFontSize(16),
    color: '#6B7280',
  },
  loginLinkText: {
    fontSize: getFontSize(16),
    color: '#6C63FF',
    fontWeight: '600',
  },
});
