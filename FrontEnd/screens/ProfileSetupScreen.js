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
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import {
  verticalScale,
  moderateScale,
  getFontSize,
  getSpacing,
  getBorderRadius
} from '../utils/responsive';

const MAJORS = [
  'Computer Science',
  'Engineering',
  'Business Administration',
  'Psychology',
  'Biology',
  'Mathematics',
  'Arts & Design',
  'Communications',
  'Other',
];

const SKILLS = [
  'JavaScript',
  'Python',
  'Java',
  'React',
  'Design',
  'Marketing',
  'Data Analysis',
  'Project Management',
  'Writing',
  'Public Speaking',
];

export default function ProfileSetupScreen({ navigation }) {
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const { updateProfile, user } = useAuth();

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSaveProfile = async () => {
    if (!major || !year) {
      Alert.alert('Error', 'Please select your major and year');
      return;
    }

    setLoading(true);

    const { data, error } = await updateProfile({
      bio: bio.trim(),
      major,
      year,
      skills: selectedSkills,
      onboarding_completed: true,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
    // Navigation will be handled by auth state change
  };

  const handleSkipForNow = async () => {
    setLoading(true);
    await updateProfile({
      onboarding_completed: true,
    });
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Help others get to know you better
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Tell us about yourself, your interests, and what you're looking for..."
                placeholderTextColor={COLORS.textTertiary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Major</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.optionsScroll}
              >
                {MAJORS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.optionChip,
                      major === m && styles.optionChipSelected,
                    ]}
                    onPress={() => setMajor(m)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        major === m && styles.optionChipTextSelected,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Year</Text>
              <View style={styles.yearContainer}>
                {['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'].map(
                  (y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.yearOption,
                        year === y && styles.yearOptionSelected,
                      ]}
                      onPress={() => setYear(y)}
                    >
                      <Text
                        style={[
                          styles.yearOptionText,
                          year === y && styles.yearOptionTextSelected,
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Skills & Interests</Text>
              <Text style={styles.helperText}>Select all that apply</Text>
              <View style={styles.skillsContainer}>
                {SKILLS.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[
                      styles.skillChip,
                      selectedSkills.includes(skill) && styles.skillChipSelected,
                    ]}
                    onPress={() => toggleSkill(skill)}
                  >
                    <Text
                      style={[
                        styles.skillChipText,
                        selectedSkills.includes(skill) &&
                          styles.skillChipTextSelected,
                      ]}
                    >
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textLight} />
              ) : (
                <Text style={styles.saveButtonText}>Complete Profile</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkipForNow}
              disabled={loading}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
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
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: getSpacing(24),
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(40),
  },
  header: {
    marginBottom: verticalScale(32),
    alignItems: 'center',
  },
  title: {
    fontSize: getFontSize(28),
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: getFontSize(16),
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: verticalScale(24),
  },
  label: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: verticalScale(8),
  },
  helperText: {
    fontSize: getFontSize(12),
    color: COLORS.textSecondary,
    marginBottom: verticalScale(8),
  },
  textArea: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: getBorderRadius(12),
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(14),
    fontSize: getFontSize(16),
    color: COLORS.text,
    minHeight: verticalScale(100),
  },
  optionsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  optionChip: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: getSpacing(20),
    paddingVertical: verticalScale(10),
    borderRadius: getBorderRadius(20),
    marginRight: getSpacing(10),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: getFontSize(14),
    color: COLORS.text,
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: COLORS.textLight,
  },
  yearContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(10),
  },
  yearOption: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(10),
    borderRadius: getBorderRadius(8),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  yearOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  yearOptionText: {
    fontSize: getFontSize(14),
    color: COLORS.text,
    fontWeight: '500',
  },
  yearOptionTextSelected: {
    color: COLORS.textLight,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(10),
  },
  skillChip: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(8),
    borderRadius: getBorderRadius(20),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillChipSelected: {
    backgroundColor: COLORS.primaryLight + '30',
    borderColor: COLORS.primary,
  },
  skillChipText: {
    fontSize: getFontSize(14),
    color: COLORS.text,
  },
  skillChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(16),
    borderRadius: getBorderRadius(12),
    alignItems: 'center',
    marginTop: verticalScale(8),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.textLight,
    fontSize: getFontSize(16),
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: getFontSize(14),
    fontWeight: '600',
  },
});

