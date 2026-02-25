import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { COLORS } from '../constants/colors';
import {
  verticalScale,
  moderateScale,
  getFontSize,
  getSpacing,
  getBorderRadius
} from '../utils/responsive';

export default function ChangePasswordScreen({ navigation }) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      console.log('[ChangePassword] Attempting to change password...');
      await api.changePassword(currentPassword, newPassword);
      
      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear fields and go back
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('[ChangePassword] Error:', error);
      const errorMessage = error.message || 'Failed to change password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Modern Background */}
      <View style={styles.background}>
        <View style={styles.purpleBase} />
        <View style={styles.purpleLayer1} />
        <View style={styles.purpleLayer2} />
        <View style={styles.purpleShape1} />
        <View style={styles.purpleShape2} />
        <View style={styles.purpleShape3} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#1877F2" />
            <Text style={styles.infoText}>
              Choose a strong password that you don't use for other accounts
            </Text>
          </View>

          {/* Current Password */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#65676B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor="#999"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#65676B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key" size={20} color="#65676B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#65676B"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>At least 6 characters</Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key" size={20} color="#65676B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#65676B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Change Password Button */}
          <TouchableOpacity
            style={[styles.changeButton, loading && styles.changeButtonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.changeButtonText}>Change Password</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Security Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Password Security Tips</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#34C759" />
              <Text style={styles.tipText}>Use at least 6 characters</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#34C759" />
              <Text style={styles.tipText}>Mix letters, numbers, and symbols</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#34C759" />
              <Text style={styles.tipText}>Don't use common passwords</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#34C759" />
              <Text style={styles.tipText}>Avoid personal information</Text>
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F0FF',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  purpleBase: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F0FF',
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
  purpleShape3: {
    position: 'absolute',
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: moderateScale(100),
    backgroundColor: '#DDD6FE',
    opacity: 0.45,
    top: '40%',
    right: moderateScale(-50),
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(12),
    paddingVertical: verticalScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228, 230, 235, 0.5)',
  },
  backButton: {
    backgroundColor: '#6C63FF',
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: getFontSize(18),
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    width: moderateScale(40),
  },
  content: {
    flex: 1,
    paddingHorizontal: getSpacing(16),
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    padding: getSpacing(12),
    borderRadius: getBorderRadius(12),
    marginTop: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(24, 119, 242, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: getFontSize(14),
    color: '#1877F2',
    marginLeft: getSpacing(12),
    lineHeight: 20,
  },
  inputSection: {
    marginTop: verticalScale(24),
  },
  label: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: verticalScale(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: 'rgba(228, 230, 235, 0.8)',
    paddingHorizontal: getSpacing(12),
    height: moderateScale(50),
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: getSpacing(8),
  },
  input: {
    flex: 1,
    fontSize: getFontSize(15),
    color: COLORS.text,
    outlineStyle: 'none',
  },
  eyeButton: {
    padding: getSpacing(4),
  },
  hint: {
    fontSize: getFontSize(12),
    color: '#65676B',
    marginTop: verticalScale(6),
    marginLeft: getSpacing(4),
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2',
    marginTop: verticalScale(32),
    paddingVertical: verticalScale(14),
    borderRadius: getBorderRadius(12),
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  changeButtonDisabled: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0.1,
  },
  changeButtonText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: getSpacing(8),
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(16),
    marginTop: verticalScale(24),
    borderWidth: 1,
    borderColor: 'rgba(228, 230, 235, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: verticalScale(12),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  tipText: {
    fontSize: getFontSize(14),
    color: '#65676B',
    marginLeft: getSpacing(8),
  },
  bottomSpace: {
    height: verticalScale(40),
  },
});
