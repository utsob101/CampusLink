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
  Switch,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import {
  verticalScale,
  moderateScale,
  getFontSize,
  getSpacing,
  getBorderRadius
} from '../utils/responsive';

export default function SettingsScreen({ navigation }) {
  const { signOut, isDemo } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from CampusLink?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check if user is demo BEFORE signOut clears the state
              const wasDemo = isDemo();
              
              // Sign out and clear all data
              await signOut();
              
              // Redirect to welcome screen
              if (wasDemo) {
                navigation.navigate('Welcome');
              } else {
                // For real users, reset navigation stack completely
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }],
                });
              }
            } catch (error) {
              console.error('[Settings] Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={22} color="#1877F2" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (
        <Ionicons name="chevron-forward" size={20} color="#65676B" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Settings */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <SettingItem
                icon="person-outline"
                title="Edit Profile"
                subtitle="Update your personal information"
                onPress={() => navigation.navigate('EditProfile')}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="key-outline"
                title="Change Password"
                subtitle="Update your account password"
                onPress={() => navigation.navigate('ChangePassword')}
              />
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.card}>
              <SettingItem
                icon="help-circle-outline"
                title="Help & Support"
                subtitle="Get help with CampusLink"
                onPress={() => navigation.navigate('HelpSupport')}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="server-outline"
                title="API Configuration"
                subtitle="Configure backend server URL"
                onPress={() => navigation.navigate('ApiConfig')}
              />
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
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
  contentWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(12),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(12),
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
  },
  section: {
    marginTop: verticalScale(20),
    paddingHorizontal: getSpacing(16),
  },
  sectionTitle: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#65676B',
    marginBottom: verticalScale(8),
    marginLeft: getSpacing(4),
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(12),
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing(12),
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: getFontSize(16),
    fontWeight: '500',
    color: COLORS.text,
  },
  settingSubtitle: {
    fontSize: getFontSize(13),
    color: '#65676B',
    marginTop: verticalScale(2),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(228, 230, 235, 0.5)',
    marginLeft: getSpacing(68),
  },
  versionText: {
    fontSize: getFontSize(15),
    color: '#65676B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    marginHorizontal: getSpacing(16),
    marginTop: verticalScale(32),
    paddingVertical: verticalScale(14),
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  logoutText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: getSpacing(8),
  },
  bottomSpace: {
    height: verticalScale(100),
  },
});

