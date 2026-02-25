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
import { COLORS } from '../constants/colors';

import {
  verticalScale,
  moderateScale,
  getFontSize,
  getSpacing,
  getBorderRadius
} from '../utils/responsive';

export default function EditProfileScreen({ navigation }) {
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    department: profile?.department || '',
    major: profile?.major || '',
    year: profile?.year || '',
    intake: profile?.intake || '',
    section: profile?.section || '',
    bio: profile?.bio || '',
  });

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Could not update profile');
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
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                placeholderTextColor="#65676B"
                selectionColor="#1877F2"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Computer Science"
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
                placeholderTextColor="#65676B"
                selectionColor="#1877F2"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Major</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Software Engineering"
                value={formData.major}
                onChangeText={(text) => setFormData({ ...formData, major: text })}
                placeholderTextColor="#65676B"
                selectionColor="#1877F2"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 3rd Year"
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                placeholderTextColor="#65676B"
                selectionColor="#1877F2"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Intake</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 51"
                value={formData.intake}
                onChangeText={(text) => setFormData({ ...formData, intake: text })}
                placeholderTextColor="#65676B"
                selectionColor="#1877F2"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Section</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 06"
                value={formData.section}
                onChangeText={(text) => setFormData({ ...formData, section: text })}
                placeholderTextColor="#65676B"
                selectionColor="#1877F2"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholderTextColor="#65676B"
                selectionColor="#1877F2"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{formData.bio.length}/500</Text>
            </View>
          </View>
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
  closeButton: {
    backgroundColor: '#EF4444',
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
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
  saveButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: getSpacing(20),
    paddingVertical: verticalScale(10),
    borderRadius: getBorderRadius(20),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(80),
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: getFontSize(16),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  form: {
    flex: 1,
    padding: getSpacing(16),
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: getFontSize(18),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: verticalScale(20),
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  label: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: verticalScale(8),
  },
  input: {
    backgroundColor: 'rgba(240, 242, 245, 0.9)',
    borderRadius: getBorderRadius(10),
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(12),
    fontSize: getFontSize(15),
    color: COLORS.text,
    borderWidth: 1,
    borderColor: 'rgba(228, 230, 235, 0.5)',
    outlineStyle: 'none',
  },
  textArea: {
    minHeight: verticalScale(100),
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: getFontSize(12),
    color: '#65676B',
    textAlign: 'right',
    marginTop: verticalScale(4),
  },
});

