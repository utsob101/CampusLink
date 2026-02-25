import React, { useState, useRef } from 'react';
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
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { api } from '../lib/api';
import { generateAvatarUrl } from '../utils/avatarHelper';
import {
  verticalScale,
  moderateScale,
  getFontSize,
  getSpacing,
  getBorderRadius,
  isSmallDevice
} from '../utils/responsive';

const POST_CATEGORIES = [
  { id: 'general', label: 'General', icon: '💬', color: '#6C63FF' },
  { id: 'events', label: 'Campus Event', icon: '🎉', color: '#FF6B9D' },
  { id: 'questions', label: 'Ask Question', icon: '❓', color: '#4ECDC4' },
  { id: 'announcements', label: 'Announcement', icon: '📢', color: '#FFE66D' },
  { id: 'study', label: 'Study Group', icon: '📚', color: '#A8DADC' },
  { id: 'project', label: 'Project', icon: '💼', color: '#F1A7FE' },
];

const POST_PRIVACY = [
  { id: 'public', label: 'Public', description: 'Anyone on campus', icon: 'earth' },
  { id: 'friends', label: 'Friends', description: 'Your connections only', icon: 'people' },
  { id: 'private', label: 'Private', description: 'Only me', icon: 'lock-closed' },
];

export default function PostCreationScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { width } = useWindowDimensions();
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedPrivacy, setSelectedPrivacy] = useState('public');
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPrivacyPicker, setShowPrivacyPicker] = useState(false);
  const [eventDetails, setEventDetails] = useState({ date: '', time: '', location: '' });
  const [showEventFields, setShowEventFields] = useState(false);
  const [tags, setTags] = useState([]);
  const [feeling, setFeeling] = useState(null);

  const FEELINGS = [
    { id: 'happy', emoji: '😊', label: 'Happy' },
    { id: 'excited', emoji: '🎉', label: 'Excited' },
    { id: 'motivated', emoji: '💪', label: 'Motivated' },
    { id: 'stressed', emoji: '😰', label: 'Stressed' },
    { id: 'accomplished', emoji: '🎯', label: 'Accomplished' },
    { id: 'curious', emoji: '🤔', label: 'Curious' },
  ];

  const userAvatar = profile?.avatar_url || generateAvatarUrl(profile?.full_name || user?.email || 'User');
  
  const selectedCategoryData = POST_CATEGORIES.find(cat => cat.id === selectedCategory);
  const selectedPrivacyData = POST_PRIVACY.find(priv => priv.id === selectedPrivacy);

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.slice(0, 5 - selectedImages.length);
        setSelectedImages([...selectedImages, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant permission to use your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImages([...selectedImages, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      Alert.alert('Empty Post', 'Please add some content or images to your post');
      return;
    }

    setLoading(true);

    try {
      console.log('[PostCreation] Creating post...');
      
      // Upload images first if any
      let imageUrls = [];
      if (selectedImages.length > 0) {
        try {
          for (const image of selectedImages) {
            const { url } = await api.uploadImage(image.uri);
            imageUrls.push(url);
          }
        } catch (uploadError) {
          console.error('[PostCreation] Image upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload images. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      // Prepare post data (user_id comes from backend auth)
      const postData = {
        content: content.trim() || ' ', // Ensure content is never empty string
        category: selectedCategory,
        privacy: selectedPrivacy,
      };

      console.log('[PostCreation] Post data:', postData);

      // Add optional fields
      if (feeling) {
        postData.feeling = feeling;
      }

      // Poll creation is now handled in ConfessionsPollsScreen

      if (showEventFields && eventDetails.date) {
        postData.event_details = eventDetails;
      }

      if (tags.length > 0) {
        postData.tags = tags;
      }

      // Add uploaded images
      if (imageUrls.length > 0) {
        postData.image_urls = imageUrls;
      }

      // Create post in database
      console.log('[PostCreation] Sending post to server:', postData);
      const response = await api.createPost(postData);
      console.log('[PostCreation] Post created successfully:', response);

      Alert.alert('Success', 'Your post has been published!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error?.message || 'Failed to create post. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleEventFields = () => {
    setShowEventFields(!showEventFields);
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
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            style={[styles.postButton, (!content.trim() && selectedImages.length === 0) && styles.postButtonDisabled]}
            onPress={handleCreatePost}
            disabled={loading || (!content.trim() && selectedImages.length === 0)}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* User Info */}
            <View style={styles.userSection}>
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
              </View>
            </View>

            {/* Category Section */}
            <View style={styles.categorySection}>
              <Text style={styles.sectionLabel}>Post Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
              >
                {POST_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryChipIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.categoryChipLabel,
                        selectedCategory === category.id && styles.categoryChipLabelSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Content Input */}
            <View style={styles.contentSection}>
              <TextInput
                style={styles.contentInput}
                placeholder={`What's on your mind, ${profile?.full_name?.split(' ')[0] || 'there'}?`}
                placeholderTextColor="#B0B3B8"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                maxLength={5000}
                selectionColor="#6C63FF"
              />
              <Text style={styles.charCount}>{content.length}/5000</Text>
            </View>

            {/* Selected Images */}
            {selectedImages.length > 0 && (
              <View style={styles.imagesSection}>
                <View style={styles.imagesGrid}>
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {selectedImages.length < 5 && (
                    <TouchableOpacity
                      style={styles.addMoreButton}
                      onPress={pickImages}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={32} color="#65676B" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Event Fields */}
            {showEventFields && (
              <View style={styles.eventSection}>
                <View style={styles.eventHeader}>
                  <Text style={styles.sectionLabel}>Event Details</Text>
                  <TouchableOpacity onPress={toggleEventFields}>
                    <Ionicons name="close-circle" size={24} color="#65676B" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.eventInput}
                  placeholder="Event Date (e.g., Dec 25, 2024)"
                  placeholderTextColor="#B0B3B8"
                  value={eventDetails.date}
                  onChangeText={(text) => setEventDetails({ ...eventDetails, date: text })}
                />
                <TextInput
                  style={styles.eventInput}
                  placeholder="Event Time (e.g., 2:00 PM)"
                  placeholderTextColor="#B0B3B8"
                  value={eventDetails.time}
                  onChangeText={(text) => setEventDetails({ ...eventDetails, time: text })}
                />
                <TextInput
                  style={styles.eventInput}
                  placeholder="Location (e.g., Main Auditorium)"
                  placeholderTextColor="#B0B3B8"
                  value={eventDetails.location}
                  onChangeText={(text) => setEventDetails({ ...eventDetails, location: text })}
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>Add to your post</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionButton} onPress={pickImages} activeOpacity={0.7}>
                  <LinearGradient
                    colors={['#45B649', '#3EA842']}
                    style={styles.actionGradient}
                  >
                    <Ionicons name="images" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.actionLabel}>Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    Alert.alert('Coming Soon', 'Tag feature will be available soon!');
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#C084FC', '#A855F7']}
                    style={styles.actionGradient}
                  >
                    <Ionicons name="pricetag" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.actionLabel}>Tag</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
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
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228, 230, 235, 0.5)',
  },
  closeButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: COLORS.text,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: getSpacing(24),
    paddingVertical: verticalScale(10),
    borderRadius: getBorderRadius(12),
    minWidth: moderateScale(80),
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#B0B3B8',
    opacity: 0.6,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: getFontSize(16),
    fontWeight: '700',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: getSpacing(8),
    marginTop: verticalScale(8),
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    marginRight: getSpacing(12),
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: getFontSize(16),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: verticalScale(4),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  privacySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: getSpacing(10),
    paddingVertical: verticalScale(4),
    borderRadius: getBorderRadius(8),
    marginRight: getSpacing(8),
  },
  privacyText: {
    fontSize: getFontSize(13),
    color: '#65676B',
    marginHorizontal: getSpacing(4),
    fontWeight: '600',
  },
  feelingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: getSpacing(10),
    paddingVertical: verticalScale(4),
    borderRadius: getBorderRadius(8),
  },
  feelingText: {
    fontSize: getFontSize(12),
    color: '#856404',
    marginRight: getSpacing(4),
    fontWeight: '600',
  },
  pickerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: getSpacing(8),
    marginTop: verticalScale(8),
    borderRadius: getBorderRadius(12),
    padding: getSpacing(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerTitle: {
    fontSize: getFontSize(16),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: verticalScale(12),
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: getSpacing(12),
    borderRadius: getBorderRadius(10),
    marginBottom: verticalScale(8),
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  pickerIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing(12),
  },
  pickerOptionInfo: {
    flex: 1,
  },
  pickerOptionLabel: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: verticalScale(2),
  },
  pickerOptionLabelSelected: {
    color: COLORS.primary,
  },
  pickerCategoryIcon: {
    fontSize: getFontSize(20),
  },
  pickerCloseButton: {
    marginTop: verticalScale(16),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
  },
  pickerCloseText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#65676B',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  categorySection: {
    marginTop: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  sectionLabel: {
    fontSize: getFontSize(14),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: verticalScale(10),
    paddingHorizontal: getSpacing(16),
  },
  categoriesScroll: {
    paddingHorizontal: getSpacing(12),
    gap: getSpacing(8),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(10),
    borderRadius: getBorderRadius(20),
    marginHorizontal: getSpacing(4),
    borderWidth: 1.5,
    borderColor: '#E4E6EB',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowOpacity: 0.15,
    elevation: 4,
  },
  categoryChipIcon: {
    fontSize: getFontSize(18),
    marginRight: getSpacing(6),
  },
  categoryChipLabel: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryChipLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(12),
    borderRadius: getBorderRadius(12),
    marginHorizontal: getSpacing(16),
    borderWidth: 1,
    borderColor: '#E4E6EB',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: getSpacing(8),
  },
  contentSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: getSpacing(8),
    marginTop: verticalScale(8),
    borderRadius: getBorderRadius(12),
    padding: getSpacing(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  contentInput: {
    fontSize: getFontSize(16),
    color: COLORS.text,
    minHeight: verticalScale(150),
    textAlignVertical: 'top',
    lineHeight: verticalScale(24),
    outlineStyle: 'none',
  },
  charCount: {
    fontSize: getFontSize(12),
    color: '#B0B3B8',
    textAlign: 'right',
    marginTop: verticalScale(8),
  },
  imagesSection: {
    marginHorizontal: getSpacing(8),
    marginTop: verticalScale(8),
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(8),
  },
  imageContainer: {
    position: 'relative',
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: getBorderRadius(12),
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  addMoreButton: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: getBorderRadius(12),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#E4E6EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: getSpacing(8),
    marginTop: verticalScale(8),
    borderRadius: getBorderRadius(12),
    padding: getSpacing(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  pollOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  pollOptionInput: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: getBorderRadius(10),
    paddingHorizontal: getSpacing(12),
    paddingVertical: verticalScale(10),
    fontSize: getFontSize(15),
    color: COLORS.text,
  },
  removePollOption: {
    marginLeft: getSpacing(8),
  },
  addPollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  addPollOptionText: {
    fontSize: getFontSize(14),
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: getSpacing(6),
  },
  eventSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: getSpacing(8),
    marginTop: verticalScale(8),
    borderRadius: getBorderRadius(12),
    padding: getSpacing(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  eventInput: {
    backgroundColor: '#F0F2F5',
    borderRadius: getBorderRadius(10),
    paddingHorizontal: getSpacing(12),
    paddingVertical: verticalScale(10),
    fontSize: getFontSize(15),
    color: COLORS.text,
    marginBottom: verticalScale(10),
  },
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: getSpacing(8),
    marginTop: verticalScale(16),
    borderRadius: getBorderRadius(12),
    padding: getSpacing(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsTitle: {
    fontSize: getFontSize(14),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: verticalScale(12),
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '31%',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  actionGradient: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionLabel: {
    fontSize: getFontSize(12),
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  bottomPadding: {
    height: verticalScale(40),
  },
});

