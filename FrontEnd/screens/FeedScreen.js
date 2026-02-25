import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
  useWindowDimensions,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api, fixImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { generateAvatarUrl } from '../utils/avatarHelper';
import { 
  scale,
  verticalScale, 
  moderateScale, 
  getFontSize, 
  getSpacing, 
  getBorderRadius,
  isSmallDevice,
  getScreenWidth,
  getScreenHeight
} from '../utils/responsive';

// Memoized Icon Component for better performance
const Icon = memo(({ name, size, color, style }) => (
  <Ionicons name={name} size={size} color={color} style={style} />
));

// Get responsive dimensions
const SCREEN_WIDTH = getScreenWidth();
const SCREEN_HEIGHT = getScreenHeight();

// Stories layout: exactly 3 per screen width (fully responsive for all Android devices)
const STORIES_PER_SCREEN = 3;
const STORY_GAP = SCREEN_WIDTH < 360 ? getSpacing(8) : getSpacing(10);
const STORIES_CONTAINER_MARGIN = getSpacing(8);
const STORIES_INNER_PADDING = getSpacing(12);
// Calculate width for exactly 3 cards visible (accounting for container margins, inner padding, and gaps)
const STORY_CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - STORIES_CONTAINER_MARGIN * 2 - STORIES_INNER_PADDING * 2 - STORY_GAP * (STORIES_PER_SCREEN - 1) - 1) /
    STORIES_PER_SCREEN
);
const STORY_CARD_HEIGHT = Math.round(STORY_CARD_WIDTH * 1.6);

// Curated, high-quality story images - perfect for campus life and student activities
const DEFAULT_STORY_IMAGE = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop';

export default function FeedScreen({ navigation }) {
  const { user, profile, isDemo, canCreate } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [feedData, setFeedData] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [notificationCount, setNotificationCount] = useState(0); // Dynamic notification count
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  
  const generatedAvatar = generateAvatarUrl(profile?.full_name || user?.email || 'User');
  const currentUserAvatar = profile?.avatar_url || (generatedAvatar.includes('format=svg') ? generatedAvatar.replace('format=svg', 'format=png') : generatedAvatar);

  const categories = ['All', 'Events', 'Questions', 'Announcements', 'General'];
  
  const categoryIcons = {
    'Events': '📅',
    'Questions': '❓',
    'Announcements': '📢',
    'General': '💬',
  };

  useEffect(() => {
    fetchPosts();
    fetchLikedPosts();
    fetchStories();
    fetchNotificationCount();
  }, []);

  // Refresh notification count every 30 seconds
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      fetchNotificationCount();
    }, 30000);

    return () => clearInterval(notificationInterval);
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const response = await api.getUnreadNotificationCount();
      setNotificationCount(response.unread_count || 0);
    } catch (error) {
      console.error('[FeedScreen] Error fetching notification count:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { posts } = await api.feed(50);
      const formatted = posts.map(p => ({
        ...p,
        timestamp: getTimeAgo(p.timestamp),
        user: {
          ...p.user,
          avatarUrl: p.user.avatarUrl || generateAvatarUrl(p.user.name || 'User'),
        }
      }));
      
      setFeedData(formatted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setFeedData([]);
      setLoading(false);
    }
  };

  const fetchLikedPosts = async () => {
    // Optional: implement endpoint to return liked posts per user.
    // For now, start empty and rely on optimistic updates.
    setLikedPosts(new Set());
  };

  const fetchStories = async () => {
    try {
      console.log('[FeedScreen] Fetching stories...');
      const response = await api.getStories();
      console.log('[FeedScreen] Stories API response:', response);
      const fetchedStories = response.stories || [];
      console.log('[FeedScreen] Stories fetched:', fetchedStories.length);
      setStories(fetchedStories);
    } catch (error) {
      console.error('[FeedScreen] Error fetching stories:', error);
      setStories([]);
    }
  };

  const handleCreateStory = async () => {
    if (!user) {
      Alert.alert('Please Sign In', 'You need to sign in to create stories');
      return;
    }

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library permissions to create stories');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16], // Story aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        console.log('[FeedScreen] Image selected:', imageUri);
        
        // Upload image first
        Alert.alert('Uploading', 'Uploading your story...');
        const { url } = await api.uploadImage(imageUri);
        
        console.log('[FeedScreen] Image uploaded:', url);
        
        // Create story with uploaded image
        await api.createStory(url);
        Alert.alert('Success', 'Story created successfully!');
        
        // Refresh stories
        await fetchStories();
      }
    } catch (error) {
      console.error('[FeedScreen] Error creating story:', error);
      Alert.alert('Error', `Could not create story: ${error.message}`);
    }
  };

  const handleStoryPress = (story) => {
    setSelectedStory(story);
    setStoryViewerVisible(true);
  };

  const closeStoryViewer = () => {
    setStoryViewerVisible(false);
    setSelectedStory(null);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPosts(), fetchLikedPosts(), fetchStories()]);
    setRefreshing(false);
  };

  const handleDeletePost = async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePost(postId);
              // Remove from local state
              setFeedData(prev => prev.filter(post => post.id !== postId));
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Could not delete post');
            }
          }
        }
      ]
    );
  };

  const handleShare = async (postId, postContent, postAuthor) => {
    if (!user) {
      Alert.alert('Please Sign In', 'You need to sign in to share posts');
      return;
    }

    Alert.alert(
      'Share Post',
      'Share this post to your feed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            try {
              await api.share(postId);
              Alert.alert('Shared!', 'Post shared to your feed');
              await fetchPosts();
            } catch (error) {
              console.error('Error sharing post:', error);
              Alert.alert('Error', 'Could not share post');
            }
          }
        }
      ]
    );
  };

  const handlePostOptions = (post) => {
    const isOwnPost = post.user.id === user?.id || post.user.id === profile?.id;
    
    const options = isOwnPost 
      ? ['Delete Post', 'Cancel']
      : ['Share Post', 'Cancel'];
    
    Alert.alert(
      'Post Options',
      null,
      isOwnPost 
        ? [
            { 
              text: 'Delete Post', 
              style: 'destructive',
              onPress: () => handleDeletePost(post.id)
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        : [
            { 
              text: 'Share Post',
              onPress: () => handleShare(post.id, post.content, post.user.name)
            },
            { text: 'Cancel', style: 'cancel' }
          ]
    );
  };

  const handleCommentPress = (post) => {
    // Navigate to CommentScreen with post data
    navigation.navigate('Comment', { post });
  };

  const fetchComments = async (postId) => {
    try {
      const { comments: list } = await api.listComments(postId);
      // Replies are not implemented in backend; keep flat list for now
      setComments(list.map(c => ({ ...c, replies: [] })));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() || !user || !selectedPost) return;

    setSubmittingComment(true);
    try {
      const { comment: created } = await api.addComment(selectedPost.id, comment.trim());
      // Refetch list to include profile
      await fetchComments(selectedPost.id);
      setComments(prev => prev);
      setComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Could not post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      Alert.alert('Please Sign In', 'You need to sign in to like posts');
      return;
    }

    const isLiked = likedPosts.has(postId);
    
    // Optimistic update
    const newLikedPosts = new Set(likedPosts);
    if (isLiked) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);

    // Update feed data optimistically
    setFeedData(prevData =>
      prevData.map(post =>
        post.id === postId
          ? { ...post, likes: post.likes + (isLiked ? -1 : 1) }
          : post
      )
    );

    try {
      if (isLiked) {
        await api.unlike(postId);
      } else {
        await api.like(postId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setLikedPosts(likedPosts);
      await fetchPosts();
    }
  };

  const renderFeedItem = useCallback(({ item }) => {
    const isLiked = likedPosts.has(item.id);
    
    return (
      <View style={styles.feedCard}>
        {/* User Header - Facebook Style */}
        <View style={styles.cardHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => {
              if (item.user.id) {
                navigation.navigate('UserProfile', { userId: item.user.id });
              }
            }}
            activeOpacity={0.7}
          >
            {item.user.avatarUrl && !item.user.avatarUrl.includes('ui-avatars.com') ? (
              <Image 
                source={{ uri: fixImageUrl(item.user.avatarUrl) }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.postAvatarPlaceholder}>
                <Ionicons name="person-circle" size={40} color="#65676B" />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.user.name}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.postTime}>{item.timestamp}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.moreButton} 
            onPress={() => handlePostOptions(item)}
            activeOpacity={0.6}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#65676B" />
          </TouchableOpacity>
        </View>

        {/* Content Text */}
        <View style={styles.contentSection}>
          <Text style={styles.content}>{item.content}</Text>
        </View>

        {/* Shared Post - LinkedIn Style */}
        {item.sharedPost ? (
          <View style={styles.sharedPostContainer}>
            <TouchableOpacity 
              style={styles.sharedPostHeader}
              onPress={() => {
                if (item.sharedPost.user.id) {
                  navigation.navigate('UserProfile', { userId: item.sharedPost.user.id });
                }
              }}
              activeOpacity={0.7}
            >
              {item.sharedPost.user.avatarUrl && !item.sharedPost.user.avatarUrl.includes('ui-avatars.com') ? (
                <Image 
                  source={{ uri: fixImageUrl(item.sharedPost.user.avatarUrl) }}
                  style={styles.sharedPostAvatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.sharedPostAvatarPlaceholder}>
                  <Ionicons name="person-circle" size={30} color="#65676B" />
                </View>
              )}
              <View style={styles.sharedPostUserDetails}>
                <Text style={styles.sharedPostUserName}>{item.sharedPost.user.name}</Text>
                <Text style={styles.sharedPostDepartment}>{item.sharedPost.user.department}</Text>
              </View>
            </TouchableOpacity>
            
            <Text style={styles.sharedPostContent}>{item.sharedPost.content}</Text>
            
            {item.sharedPost.imageUrl ? (
              <Image 
                source={{ uri: item.sharedPost.imageUrl }} 
                style={styles.sharedPostImage} 
                resizeMode="cover" 
              />
            ) : null}
          </View>
        ) : null}

        {/* Optional Image (only if not a shared post) */}
        {item.imageUrl && !item.sharedPost ? (
          <Image source={{ uri: fixImageUrl(item.imageUrl) }} style={styles.postImage} resizeMode="cover" />
        ) : null}

        {/* Engagement Stats - Facebook Style */}
        <View style={styles.engagementStats}>
          <View style={styles.statsLeft}>
            <View style={styles.reactionIcons}>
              <View style={[styles.reactionBubble, styles.reactionBubbleLike]}>
                <Ionicons name="thumbs-up" size={10} color="#FFFFFF" />
              </View>
              <View style={[styles.reactionBubble, styles.reactionBubbleHeart, { marginLeft: -6 }]}>
                <Ionicons name="heart" size={10} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statsText}>{item.likes > 0 ? `${item.likes}` : ''}</Text>
          </View>
          <View style={styles.statsRight}>
            <Text style={styles.statsText}>{item.comments} Comments</Text>
          </View>
        </View>

        {/* Action Buttons - Facebook Style */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
            activeOpacity={0.6}
          >
            <Ionicons 
              name={isLiked ? "thumbs-up" : "thumbs-up-outline"} 
              size={20} 
              color={isLiked ? COLORS.primary : '#65676B'}
              style={styles.actionIconSpacing}
            />
            <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
              Like
            </Text>
          </TouchableOpacity>
          
          <View style={styles.actionDivider} />
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.6}
            onPress={() => handleCommentPress(item)}
          >
            <Ionicons 
              name="chatbox-ellipses-outline" 
              size={20} 
              color="#65676B"
              style={styles.actionIconSpacing}
            />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          
          
          <View style={styles.actionDivider} />
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.6}
            onPress={() => handleShare(item.id, item.content, item.user.name)}
          >
            <Ionicons 
              name="share-social-outline" 
              size={20} 
              color="#65676B"
              style={styles.actionIconSpacing}
            />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [likedPosts, handleLike, navigation]);

  const filteredData = useMemo(() => 
    activeFilter === 'All' 
      ? feedData 
      : feedData.filter(post => post.category?.toLowerCase() === activeFilter.toLowerCase()),
    [activeFilter, feedData]
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
        {/* Header - Clean White */}
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.8)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
        <View style={styles.header}>
            <View style={styles.headerLeft}>
              {/* Demo Version Text */}
              {isDemo() && (
                <View style={styles.demoVersionContainer}>
                  <Text style={styles.demoVersionText}>DEMO VERSION</Text>
                </View>
              )}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoIcon}>🎓</Text>
                </View>
                <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>CampusLink</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerRight}>
              {/* Beautiful Notification Icon */}
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => {
                  navigation.navigate('Notifications');
                  setNotificationCount(0);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.notificationIconContainer}>
                  <LinearGradient
                    colors={notificationCount > 0 ? ['#6C63FF', '#8B5CF6'] : ['#F0F2F5', '#F0F2F5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.notificationGradient}
                  >
                    <Ionicons 
                      name={notificationCount > 0 ? "notifications" : "notifications-outline"} 
                      size={22} 
                      color={notificationCount > 0 ? "#FFFFFF" : "#65676B"} 
                    />
                  </LinearGradient>
                  {notificationCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.7}
              >
                <Ionicons name="person-circle-outline" size={24} color="#65676B" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Composer */}
        <View style={styles.composerCard}>
          <TouchableOpacity
            style={styles.composerAddButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PostCreation')}
          >
            <Ionicons name="add-circle" size={36} color="#6C63FF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.composerInput, !canCreate() && styles.disabledButton]}
            activeOpacity={canCreate() ? 0.8 : 1}
            onPress={() => canCreate() && navigation.navigate('PostCreation')}
            disabled={!canCreate()}
          >
            <Text style={[styles.composerPlaceholder, !canCreate() && styles.disabledText]}>
              {canCreate() ? "What's on your mind?" : "Demo Mode - Create Post Disabled"}
            </Text>
          </TouchableOpacity>
        </View>

        
        {/* Feed List (Stories + Filters scroll with posts) */}
        

        <FlatList
          data={filteredData}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedList}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={3}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 400,
            offset: 400 * index,
            index,
          })}
          ListHeaderComponent={(
            <>
              {/* Stories - scrollable */}
              <View style={styles.storiesSection}>
                <ScrollView
                  horizontal
                  snapToInterval={STORY_CARD_WIDTH + STORY_GAP}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.storiesScroll}
                  snapToAlignment="start"
                  removeClippedSubviews={Platform.OS === 'android'}
                  scrollEventThrottle={16}
                >
                  {/* Create Story first */}
                  <TouchableOpacity 
                    style={styles.storyCard}
                    onPress={handleCreateStory}
                    activeOpacity={0.7}
                  >
                    <View style={styles.createStoryBackground}>
                      {profile?.avatar_url ? (
                        <View style={styles.createStoryAvatarContainer}>
                          <Image 
                            source={{ uri: fixImageUrl(profile.avatar_url) }} 
                            style={styles.createStoryAvatar}
                            resizeMode="cover"
                          />
                        </View>
                      ) : (
                        <View style={styles.createStoryAvatarContainer}>
                          <View style={styles.createStoryAvatarPlaceholder}>
                            <Ionicons name="person" size={36} color="#65676B" />
                          </View>
                        </View>
                      )}
                      <View style={styles.createStoryPlusButton}>
                        <Text style={styles.createStoryPlusText}>+</Text>
                      </View>
                    </View>
                    <Text style={styles.storyName}>Create story</Text>
                  </TouchableOpacity>
                  
                  {/* User Stories from Database */}
                  {stories.map((userStory, idx) => (
                    <TouchableOpacity 
                      key={`story-${userStory.user.id}-${idx}`} 
                      style={styles.storyCard}
                      activeOpacity={0.8}
                      onPress={() => handleStoryPress(userStory)}
                    >
                      <Image 
                        source={{ uri: userStory.stories[0]?.image_url || DEFAULT_STORY_IMAGE }} 
                        style={styles.storyImage} 
                      />
                      <View style={styles.storyAvatarRing}>
                        {userStory.user.avatar_url ? (
                          <Image 
                            source={{ uri: fixImageUrl(userStory.user.avatar_url) }} 
                            style={styles.storyAvatar}
                          />
                        ) : (
                          <View style={styles.storyAvatarPlaceholder}>
                            <Ionicons name="person" size={14} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.storyName} numberOfLines={1}>
                        {userStory.user.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Category Filters - single row, no horizontal scroll */}
              <View style={styles.filterSection}>
                <View style={styles.filterRow}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterChip,
                        activeFilter === category && styles.filterChipActive,
                      ]}
                      onPress={() => setActiveFilter(category)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.filterChipText,
                        activeFilter === category && styles.filterChipTextActive,
                      ]}
                        numberOfLines={1}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>📱</Text>
              </View>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>
                {activeFilter === 'All' 
                  ? 'Be the first to share something with your campus!'
                  : `No ${activeFilter.toLowerCase()} posts at the moment`}
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('PostCreation')}
              >
                <Text style={styles.emptyButtonText}>Create Post</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Floating Action Button - Chat */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1877F2', '#0C63D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Half-Screen Comment Modal */}
        {showCommentModal && selectedPost && (
          <View style={styles.commentModalOverlay}>
            <View style={styles.commentModal}>
              {/* Modal Header */}
              <View style={styles.commentModalHeader}>
                <Text style={styles.commentModalTitle}>Comments</Text>
                <TouchableOpacity
                  style={styles.commentModalClose}
                  onPress={() => {
                    setShowCommentModal(false);
                    setSelectedPost(null);
                    setComment('');
                    setComments([]);
                  }}
                >
                  <Ionicons name="close" size={24} color="#65676B" />
                </TouchableOpacity>
              </View>

              {/* Comments List */}
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                style={styles.commentsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyCommentsContainer}>
                    <Text style={styles.emptyCommentsText}>No comments yet</Text>
                    <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Image 
                      source={{ uri: fixImageUrl(item.profiles?.avatar_url) || generateAvatarUrl(item.profiles?.full_name || 'User') }} 
                      style={styles.commentAvatar} 
                    />
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{item.profiles?.full_name || 'User'}</Text>
                        <Text style={styles.commentTime}>{getTimeAgo(item.created_at)}</Text>
                      </View>
                      <Text style={styles.commentText}>{item.content}</Text>
                      
                      {/* Comment Reactions */}
                      <View style={styles.commentReactions}>
                        <TouchableOpacity style={styles.reactionButton} activeOpacity={0.7}>
                          <Ionicons name="heart-outline" size={16} color="#65676B" />
                          <Text style={styles.reactionCount}>{Math.floor(Math.random() * 5) + 1}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.reactionButton} activeOpacity={0.7}>
                          <Ionicons name="thumbs-up-outline" size={16} color="#65676B" />
                          <Text style={styles.reactionCount}>{Math.floor(Math.random() * 8) + 2}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.replyButton} activeOpacity={0.7}>
                          <Ionicons name="chatbubble-outline" size={16} color="#65676B" />
                          <Text style={styles.replyText}>Reply</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Replies Section */}
                      {item.replies && item.replies.length > 0 && (
                        <View style={styles.repliesContainer}>
                          {item.replies.map((reply) => (
                            <View key={reply.id} style={styles.replyItem}>
                              <Image 
                                source={{ uri: fixImageUrl(reply.profiles?.avatar_url) || generateAvatarUrl(reply.profiles?.full_name || 'User') }} 
                                style={styles.replyAvatar} 
                              />
                              <View style={styles.replyContent}>
                                <View style={styles.replyHeader}>
                                  <Text style={styles.replyAuthor}>{reply.profiles?.full_name || 'User'}</Text>
                                  <Text style={styles.replyTime}>{getTimeAgo(reply.created_at)}</Text>
                                </View>
                                <Text style={styles.replyText}>{reply.content}</Text>
                                <View style={styles.replyReactions}>
                                  <TouchableOpacity style={styles.reactionButton} activeOpacity={0.7}>
                                    <Ionicons name="heart-outline" size={14} color="#65676B" />
                                    <Text style={styles.reactionCount}>{Math.floor(Math.random() * 3)}</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity style={styles.reactionButton} activeOpacity={0.7}>
                                    <Ionicons name="thumbs-up-outline" size={14} color="#65676B" />
                                    <Text style={styles.reactionCount}>{Math.floor(Math.random() * 4) + 1}</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                )}
              />

              {/* Comment Input */}
              <View style={styles.commentInputContainer}>
                <View style={styles.commentInputWrapper}>
                  <Image 
                    source={{ uri: fixImageUrl(currentUserAvatar) }} 
                    style={styles.commentInputAvatar} 
                  />
                  <TextInput
                    style={[styles.commentInput, !canWrite() && styles.disabledCommentInput]}
                    placeholder={canWrite() ? "Write a comment..." : "Demo Mode - Cannot Write Comments"}
                    value={comment}
                    onChangeText={canWrite() ? setComment : undefined}
                    multiline
                    maxLength={500}
                    placeholderTextColor="#65676B"
                    selectionColor="#6C63FF"
                    editable={canWrite()}
                    outlineStyle="none"
                  />
                </View>
                {canWrite() && (
                  <TouchableOpacity
                    style={[styles.commentSendButton, comment.trim() && !submittingComment && styles.commentSendButtonActive]}
                    onPress={handleSubmitComment}
                    disabled={!comment.trim() || submittingComment}
                >
                  {submittingComment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name="send"
                      size={20}
                      color={comment.trim() ? '#FFFFFF' : '#65676B'}
                    />
                  )}
                </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Full-Screen Story Viewer Modal */}
        <Modal
          visible={storyViewerVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeStoryViewer}
        >
          <View style={styles.storyViewerContainer}>
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.storyCloseButton}
              onPress={closeStoryViewer}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={30} color="#FFFFFF" />
            </TouchableOpacity>

            {selectedStory && (
              <>
                {/* Story Header */}
                <View style={styles.storyHeader}>
                  <View style={styles.storyUserInfo}>
                    {selectedStory.user?.avatar_url ? (
                      <Image 
                        source={{ uri: fixImageUrl(selectedStory.user.avatar_url) }} 
                        style={styles.storyViewerAvatar}
                      />
                    ) : (
                      <View style={styles.storyViewerAvatarPlaceholder}>
                        <Ionicons name="person" size={20} color="#FFFFFF" />
                      </View>
                    )}
                    <View style={styles.storyUserDetails}>
                      <Text style={styles.storyViewerName}>{selectedStory.user?.name || 'User'}</Text>
                      <Text style={styles.storyViewerTime}>
                        {selectedStory.stories?.[0]?.created_at 
                          ? getTimeAgo(selectedStory.stories[0].created_at)
                          : 'Recently'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Story Image */}
                <View style={styles.storyImageContainer}>
                  <Image 
                    source={{ uri: fixImageUrl(selectedStory.stories?.[0]?.image_url) || DEFAULT_STORY_IMAGE }} 
                    style={styles.storyViewerImage}
                    resizeMode="contain"
                  />
                </View>
              </>
            )}
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F0FF',
  },
  // Modern Background Layers
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
  },
  contentWrapper: {
    flex: 1,
  },
  
  // Header Styles - Modern & Impressive
  headerGradient: {
    marginHorizontal: getSpacing(8),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(12),
    borderBottomLeftRadius: getBorderRadius(12),
    borderBottomRightRadius: getBorderRadius(12),
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(14),
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing(12),
  },
  logoIcon: {
    fontSize: getFontSize(24),
  },
  titleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: getFontSize(22),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(10),
  },
  // Beautiful Notification Button Styles
  notificationButton: {
    position: 'relative',
  },
  notificationIconContainer: {
    position: 'relative',
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(20),
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getSpacing(4),
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: getFontSize(10),
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: getFontSize(10),
  },
  iconButton: {
    position: 'relative',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconText: {
    fontSize: 18,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    top: -3,
    left: -3,
  },

  // Filter Styles - Modern & Brand Consistent
  filterSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: verticalScale(12),
    marginBottom: verticalScale(12),
    marginHorizontal: getSpacing(8),
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  filterScroll: {
    paddingHorizontal: getSpacing(16),
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(12),
  },
  filterChip: {
    paddingHorizontal: getSpacing(12),
    paddingVertical: verticalScale(6),
    borderRadius: getBorderRadius(16),
    backgroundColor: '#F0F2F5',
    flexShrink: 1,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: getFontSize(12),
    fontWeight: '700',
    color: '#65676B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Feed List Styles
  feedList: {
    paddingBottom: verticalScale(120),
  },
  
  // Composer
  composerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(12),
    marginHorizontal: getSpacing(8),
    marginBottom: verticalScale(12),
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  composerAddButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing(10),
  },
  composerInput: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: getBorderRadius(24),
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(10),
    height: moderateScale(44),
    justifyContent: 'center',
  },
  composerPlaceholder: {
    color: '#65676B',
    fontSize: getFontSize(15),
  },
  
  // Stories
  storiesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: verticalScale(12),
    marginHorizontal: getSpacing(8),
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
  storiesScroll: {
    paddingLeft: getSpacing(12),
    paddingRight: getSpacing(12) - STORY_GAP,
    paddingVertical: verticalScale(10),
  },
  storyCard: {
    width: STORY_CARD_WIDTH,
    height: STORY_CARD_HEIGHT,
    borderRadius: getBorderRadius(14),
    backgroundColor: '#F8F9FA',
    marginRight: STORY_GAP,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  storyImage: {
    width: '100%',
    height: STORY_CARD_HEIGHT - verticalScale(40),
    resizeMode: 'cover',
    backgroundColor: '#F0F2F5',
  },
  storyAvatarRing: {
    position: 'absolute',
    top: getSpacing(8),
    left: getSpacing(8),
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storyAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
  },
  storyName: {
    fontSize: getFontSize(12),
    paddingTop: verticalScale(8),
    color: COLORS.text,
    fontWeight: '700',
  },
  // Create Story Styles
  createStoryBackground: {
    width: '100%',
    height: STORY_CARD_HEIGHT - 40,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  createStoryAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createStoryAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F0FE',
  },
  createStoryAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createStoryPlusButton: {
    position: 'absolute',
    bottom: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  createStoryPlusText: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  storyBadge: {
    position: 'absolute',
    bottom: 40,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: 'bold',
  },
  storyDot: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyDotText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  
  // Feed Card Styles - Modern Card Style
  feedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: verticalScale(12),
    marginHorizontal: getSpacing(8),
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
  categoryBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight + '15',
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '30',
  },
  categoryTextSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing(12),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(12),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarImage: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: getSpacing(10),
    backgroundColor: COLORS.backgroundGray,
  },
  postAvatarPlaceholder: {
    width: moderateScale(40),
    height: moderateScale(40),
    marginRight: getSpacing(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(2),
  },
  userName: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: verticalScale(2),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: getFontSize(13),
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  moreButton: {
    padding: getSpacing(8),
  },
  contentSection: {
    paddingHorizontal: getSpacing(12),
    paddingBottom: verticalScale(12),
  },
  content: {
    fontSize: getFontSize(15),
    color: COLORS.text,
    lineHeight: verticalScale(20),
    fontWeight: '400',
  },
  postImage: {
    width: '100%',
    height: SCREEN_WIDTH * 0.9,
    backgroundColor: COLORS.background,
  },

  // Shared Post Styles - LinkedIn Style
  sharedPostContainer: {
    marginHorizontal: getSpacing(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#E4E6EB',
    borderRadius: moderateScale(8),
    backgroundColor: '#F7F8FA',
    overflow: 'hidden',
  },
  sharedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing(12),
    backgroundColor: '#FFFFFF',
  },
  sharedPostAvatar: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    marginRight: getSpacing(8),
  },
  sharedPostAvatarPlaceholder: {
    width: moderateScale(30),
    height: moderateScale(30),
    marginRight: getSpacing(8),
  },
  sharedPostUserDetails: {
    flex: 1,
  },
  sharedPostUserName: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: COLORS.text,
  },
  sharedPostDepartment: {
    fontSize: getFontSize(12),
    color: '#65676B',
    marginTop: verticalScale(1),
  },
  sharedPostContent: {
    fontSize: getFontSize(14),
    color: COLORS.text,
    lineHeight: verticalScale(18),
    paddingHorizontal: getSpacing(12),
    paddingBottom: verticalScale(12),
  },
  sharedPostImage: {
    width: '100%',
    height: SCREEN_WIDTH * 0.5,
    backgroundColor: COLORS.background,
  },

  // Engagement Stats - Exact Facebook Style
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing(12),
    paddingVertical: verticalScale(8),
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionIcons: {
    flexDirection: 'row',
    marginRight: getSpacing(5),
  },
  reactionBubble: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  reactionBubbleLike: {
    backgroundColor: '#1877F2',
  },
  reactionBubbleHeart: {
    backgroundColor: '#F23854',
  },
  reactionEmoji: {
    fontSize: getFontSize(11),
  },
  statsText: {
    fontSize: getFontSize(13),
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  statsDot: {
    fontSize: getFontSize(13),
    color: COLORS.textSecondary,
    marginHorizontal: getSpacing(2),
  },

  // Action Styles - Exact Facebook Style
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing(4),
    paddingVertical: verticalScale(4),
    borderTopWidth: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: getSpacing(4),
  },
  actionDivider: {
    width: 1,
    height: moderateScale(24),
    backgroundColor: '#E4E6EB',
  },
  actionIcon: {
    fontSize: getFontSize(20),
    marginRight: getSpacing(6),
  },
  actionIconSpacing: {
    marginRight: getSpacing(6),
  },
  actionIconLiked: {
    transform: [{ scale: 1.05 }],
  },
  actionText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  actionTextLiked: {
    color: COLORS.primary,
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? 40 : 60,
    paddingHorizontal: isSmallDevice ? 24 : 40,
  },
  emptyIconContainer: {
    width: isSmallDevice ? 100 : 120,
    height: isSmallDevice ? 100 : 120,
    borderRadius: isSmallDevice ? 50 : 60,
    backgroundColor: COLORS.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallDevice ? 20 : 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
    borderColor: COLORS.primaryLight + '30',
  },
  emptyIcon: {
    fontSize: isSmallDevice ? 40 : 48,
  },
  emptyText: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: isSmallDevice ? 13 : 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: isSmallDevice ? 20 : 24,
    lineHeight: isSmallDevice ? 18 : 20,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: isSmallDevice ? 32 : 36,
    paddingVertical: isSmallDevice ? 14 : 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: COLORS.textLight,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // FAB Styles - Facebook style
  fab: {
    position: 'absolute',
    bottom: verticalScale(24),
    right: getSpacing(20),
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  fabGradient: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  // Comment Modal Styles
  commentModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  commentModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%',
    paddingTop: 20,
  },
  commentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  commentModalClose: {
    padding: 5,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#65676B',
    marginBottom: 8,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  commentText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#65676B',
  },
  commentReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: '#65676B',
    marginLeft: 4,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  replyText: {
    fontSize: 12,
    color: '#65676B',
    marginLeft: 4,
  },
  repliesContainer: {
    marginTop: 12,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E4E6EB',
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  replyTime: {
    fontSize: 11,
    color: '#65676B',
  },
  replyText: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 18,
    marginBottom: 6,
  },
  replyReactions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
    backgroundColor: '#F8F9FA',
  },
  commentInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  commentInputAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    maxHeight: 80,
    outlineStyle: 'none',
    borderWidth: 0,
  },
  commentSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E4E6EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendButtonActive: {
    backgroundColor: '#6C63FF',
  },
  // Demo Mode Styles
  demoVersionContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  demoVersionText: {
    color: '#FF0000',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  disabledCommentInput: {
    opacity: 0.5,
    backgroundColor: '#E4E6EB',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#E4E6EB',
  },
  disabledText: {
    color: '#8B8B8B',
  },
  // Story Viewer Modal Styles
  storyViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 80,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyViewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyViewerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#65676B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyUserDetails: {
    marginLeft: 12,
  },
  storyViewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyViewerTime: {
    fontSize: 12,
    color: '#E4E6EB',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyViewerImage: {
    width: '100%',
    height: '100%',
  },
});

