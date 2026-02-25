import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
  Image,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api, fixImageUrl } from '../lib/api';
import { 
  pickImageFromLibrary, 
  takePhoto, 
  uploadAvatarToSupabase, 
  updateProfileAvatar,
  removeProfileAvatar,
  generateAvatarUrl
} from '../utils/avatarHelper';
import { COLORS } from '../constants/colors';
import { 
  verticalScale, 
  moderateScale, 
  getFontSize, 
  getSpacing, 
  getBorderRadius,
  isSmallDevice
} from '../utils/responsive';

export default function ProfileScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const { user, profile, signOut, updateProfile, fetchUserProfile, isDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    projects: 0,
    connections: 0,
  });

  useEffect(() => {
    if (user) {
      fetchMyPosts();
    }
  }, [user]);

  // Focus listener to refresh stats when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        fetchStats();
        fetchMyPosts();
      }
    });

    return unsubscribe;
  }, [navigation, user]);

  const fetchStats = async () => {
    try {
      // Fetch project stats from backend
      const { stats: projectStats } = await api.getProjectStats();
      
      setStats(prev => ({
        ...prev,
        projects: projectStats?.total || 0,
      }));
    } catch (error) {
      console.error('[Profile] Error fetching stats:', error);
    }
  };

  const fetchMyPosts = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingPosts(true);
      console.log('[Profile] Fetching user posts for:', user.id);
      const response = await api.getUserProfile(user.id);
      console.log('[Profile] User profile response:', response);
      setMyPosts(response.profile?.posts || []);
      
      // Fetch project stats separately
      try {
        const { stats: projectStats } = await api.getProjectStats();
        setStats({
          posts: response.profile?.posts?.length || 0,
          projects: projectStats?.total || 0,
          connections: response.profile?.connections_count || 0,
        });
      } catch (statsError) {
        console.error('[Profile] Error fetching project stats:', statsError);
        setStats({
          posts: response.profile?.posts?.length || 0,
          projects: 0,
          connections: response.profile?.connections_count || 0,
        });
      }
    } catch (error) {
      console.error('[Profile] Error fetching posts:', error);
      setMyPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLogout = async () => {
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
              setLoading(true);
              
              // Check if user is demo BEFORE signOut clears the state
              const wasDemo = isDemo();
              
              // Sign out and clear all data
              await signOut();
              
              setLoading(false);
              
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
              console.error('[Profile] Logout error:', error);
              setLoading(false);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Photo'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handleChoosePhoto();
          } else if (buttonIndex === 3) {
            handleRemovePhoto();
          }
        }
      );
    } else {
      Alert.alert(
        'Profile Picture',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: handleTakePhoto,
          },
          {
            text: 'Choose from Library',
            onPress: handleChoosePhoto,
          },
          ...(profile?.avatar_url ? [
            {
              text: 'Remove Photo',
              onPress: handleRemovePhoto,
              style: 'destructive',
            }
          ] : []),
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleTakePhoto = async () => {
    const uri = await takePhoto();
    if (uri) {
      uploadAvatar(uri);
    }
  };

  const handleChoosePhoto = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) {
      uploadAvatar(uri);
    }
  };

  const uploadAvatar = async (uri) => {
    setUploadingAvatar(true);
    
    try {
    
      if (error) {
        Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
        setUploadingAvatar(false);
        return;
      }

      // Update profile with new avatar URL
      const { success } = await updateProfileAvatar(user.id, publicUrl);
      
      if (success) {
        // Force refresh profile to get updated avatar (bypass cache)
        await fetchUserProfile(user.id, true);
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        Alert.alert('Update Failed', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture? This will delete the image from the server and reset to the default avatar.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingAvatar(true);
              console.log('[ProfileScreen] Removing avatar...');
              
              // Call new API that deletes the file from uploads folder
              const { success, user: updatedUser, error } = await removeProfileAvatar();
              
              if (success) {
                console.log('[ProfileScreen] Avatar removed successfully');
                // Refresh profile to show default avatar
                await fetchUserProfile(user.id, true);
                Alert.alert('Success', 'Profile picture removed and file deleted from server');
              } else {
                console.error('[ProfileScreen] Failed to remove avatar:', error);
                Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
              }
            } catch (error) {
              console.error('[ProfileScreen] Error removing avatar:', error);
              Alert.alert('Error', 'An unexpected error occurred while removing the profile picture.');
            } finally {
              setUploadingAvatar(false);
            }
          },
        },
      ]
    );
  };

  const profileStats = [
    { label: 'Posts', value: stats.posts?.toString() || myPosts.length.toString() },
    { label: 'Connections', value: stats.connections?.toString() || '0' },
    { label: 'Projects', value: stats.projects?.toString() || '0' },
  ];

  const menuItems = [
    { icon: '👤', label: 'Edit Profile', action: () => navigation.navigate('EditProfile') },
    { icon: '👥', label: 'My Network', action: () => navigation.navigate('Connections') },
    { icon: '🎓', label: 'My Projects', action: () => navigation.navigate('MyProjects') },
    { icon: '⚙️', label: 'Settings', action: () => navigation.navigate('Settings') },
    { icon: '❓', label: 'Help & Support', action: () => navigation.navigate('HelpSupport') },
    { icon: '📄', label: 'Terms & Privacy', action: () => navigation.navigate('TermsPrivacy') },
  ];

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
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              activeOpacity={0.8}
              disabled={uploadingAvatar}
            >
              <View style={styles.avatarImageContainer}>
                <Image 
                  source={{ 
                    uri: fixImageUrl(profile?.avatar_url) || generateAvatarUrl(profile?.full_name || user?.email || 'User')
                  }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
                <View style={styles.avatarRing} />
              </View>
              
              {/* Edit Badge */}
              <View style={styles.editBadge}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryLight]}
                  style={styles.editBadgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </View>
            </TouchableOpacity>
            
            <Text style={styles.profileName}>{profile?.full_name || 'CampusLink User'}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="document-text-outline" size={18} color="#6366F1" style={styles.statIcon} />
              <Text style={styles.statValue}>{profileStats[0].value}</Text>
              <Text style={styles.statLabel}>{profileStats[0].label}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={18} color="#6366F1" style={styles.statIcon} />
              <Text style={styles.statValue}>{profileStats[1].value}</Text>
              <Text style={styles.statLabel}>{profileStats[1].label}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="briefcase-outline" size={18} color="#6366F1" style={styles.statIcon} />
              <Text style={styles.statValue}>{profileStats[2].value}</Text>
              <Text style={styles.statLabel}>{profileStats[2].label}</Text>
            </View>
          </View>

          {/* My Posts Section */}
          <TouchableOpacity
            style={styles.postsSection}
            onPress={() => navigation.navigate('MyPosts')}
            activeOpacity={0.7}
          >
            <View style={styles.postsSectionHeader}>
              <View style={styles.postsSectionLeft}>
                <Text style={styles.postsSectionTitle}>My Posts</Text>
                <Text style={styles.postsCount}>{myPosts.length} posts</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#6C63FF" />
            </View>
            
            {loadingPosts ? (
              <View style={styles.postsLoading}>
                <ActivityIndicator size="small" color="#6C63FF" />
              </View>
            ) : myPosts.length === 0 ? (
              <View style={styles.emptyPosts}>
                <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyPostsText}>No posts yet</Text>
                <Text style={styles.emptyPostsSubtext}>Share your first post with the community</Text>
              </View>
            ) : (
              <View style={styles.postsPreview}>
                <Text style={styles.postsPreviewText}>
                  Tap to view all your posts with full controls
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.menuItem}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.menuIconContainer}>
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Logout</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Version */}
          <Text style={styles.version}>Version 1.0.0</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(16),
  },
  backButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: getFontSize(24),
    color: '#6C63FF',
    fontWeight: '600',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: '#000000',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  headerSpacer: {
    width: moderateScale(44),
    height: moderateScale(44),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getSpacing(20),
    paddingBottom: verticalScale(100),
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: verticalScale(24),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: verticalScale(20),
  },
  avatarImageContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: isSmallDevice ? moderateScale(110) : moderateScale(120),
    height: isSmallDevice ? moderateScale(110) : moderateScale(120),
    borderRadius: isSmallDevice ? moderateScale(55) : moderateScale(60),
    backgroundColor: COLORS.backgroundGray,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarRing: {
    position: 'absolute',
    width: isSmallDevice ? moderateScale(122) : moderateScale(132),
    height: isSmallDevice ? moderateScale(122) : moderateScale(132),
    borderRadius: isSmallDevice ? moderateScale(61) : moderateScale(66),
    borderWidth: 2,
    borderColor: COLORS.primary,
    opacity: 0.2,
    top: -6,
    left: -6,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: isSmallDevice ? moderateScale(36) : moderateScale(40),
    height: isSmallDevice ? moderateScale(36) : moderateScale(40),
    borderRadius: isSmallDevice ? moderateScale(18) : moderateScale(20),
    backgroundColor: '#FFFFFF',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  editBadgeGradient: {
    width: '100%',
    height: '100%',
    borderRadius: isSmallDevice ? moderateScale(18) : moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: getFontSize(24),
    fontWeight: '800',
    color: '#000000',
    marginBottom: verticalScale(12),
    letterSpacing: -0.5,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
    gap: isSmallDevice ? getSpacing(8) : getSpacing(10),
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getBorderRadius(20),
    padding: isSmallDevice ? getSpacing(14) : getSpacing(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minHeight: isSmallDevice ? moderateScale(82) : moderateScale(90),
  },
  statIcon: {
    marginBottom: getSpacing(6),
    opacity: 0.8,
  },
  statValue: {
    fontSize: isSmallDevice ? getFontSize(22) : getFontSize(26),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: verticalScale(2),
    letterSpacing: -0.5,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  statLabel: {
    fontSize: isSmallDevice ? getFontSize(10) : getFontSize(11),
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 0.2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  menuSection: {
    marginBottom: verticalScale(20),
    gap: getSpacing(10),
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: isSmallDevice ? verticalScale(14) : verticalScale(16),
    paddingHorizontal: isSmallDevice ? getSpacing(14) : getSpacing(16),
    borderRadius: getBorderRadius(16),
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.08)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: getSpacing(10),
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: getBorderRadius(12),
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing(14),
  },
  menuIcon: {
    fontSize: getFontSize(20),
  },
  menuLabel: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#1A1A1A',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: verticalScale(16),
    borderRadius: getBorderRadius(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutIcon: {
    fontSize: getFontSize(20),
    marginRight: getSpacing(10),
  },
  logoutText: {
    fontSize: getFontSize(16),
    fontWeight: '700',
    color: '#EF4444',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  version: {
    fontSize: getFontSize(13),
    fontWeight: '500',
    color: '#999999',
    textAlign: 'center',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  // Posts Section
  postsSection: {
    marginBottom: verticalScale(24),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(16),
  },
  postsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  postsSectionLeft: {
    flex: 1,
  },
  postsSectionTitle: {
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: verticalScale(4),
  },
  postsCount: {
    fontSize: getFontSize(14),
    color: '#6C63FF',
    fontWeight: '600',
  },
  postsPreview: {
    paddingVertical: verticalScale(20),
    alignItems: 'center',
  },
  postsPreviewText: {
    fontSize: getFontSize(14),
    color: '#6B7280',
    textAlign: 'center',
  },
  postsLoading: {
    paddingVertical: verticalScale(40),
    alignItems: 'center',
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: verticalScale(40),
    paddingHorizontal: getSpacing(20),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.3)',
    borderStyle: 'dashed',
  },
  emptyPostsText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#6B7280',
    marginTop: verticalScale(12),
  },
  emptyPostsSubtext: {
    fontSize: getFontSize(13),
    color: '#9CA3AF',
    marginTop: verticalScale(4),
    textAlign: 'center',
  },
  postsList: {
    gap: verticalScale(12),
  },
  postCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(16),
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.3)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  postCategory: {
    fontSize: getFontSize(11),
    fontWeight: '700',
    color: '#6C63FF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  postTime: {
    fontSize: getFontSize(12),
    color: '#9CA3AF',
  },
  postContent: {
    fontSize: getFontSize(15),
    color: '#1F2937',
    lineHeight: getFontSize(22),
    marginBottom: verticalScale(8),
  },
  postImage: {
    width: '100%',
    height: verticalScale(150),
    borderRadius: getBorderRadius(8),
    backgroundColor: '#E5E7EB',
    marginBottom: verticalScale(12),
  },
  postStats: {
    flexDirection: 'row',
    gap: getSpacing(20),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(209, 213, 219, 0.3)',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(4),
  },
  postStatText: {
    fontSize: getFontSize(13),
    color: '#65676B',
    fontWeight: '500',
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getSpacing(8),
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingVertical: verticalScale(12),
    paddingHorizontal: getSpacing(16),
    borderRadius: getBorderRadius(10),
    marginTop: verticalScale(8),
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  showAllText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#6C63FF',
  },
});
