import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
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
  SCREEN_WIDTH,
} from '../utils/responsive';

export default function MyPostsScreen({ navigation }) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const currentUserId = user?.id || profile?.id;
      
      // Fetch from feed API (same as FeedScreen)
      const response = await api.feed(100);
      const allPosts = response.posts || [];
      
      // Filter to show only current user's posts
      const userPosts = allPosts.filter(post => post.user?.id === currentUserId);
      
      console.log('[MyPosts] Total posts:', allPosts.length);
      console.log('[MyPosts] User posts:', userPosts.length);
      setPosts(userPosts);
      
      // Get liked posts
      const liked = new Set();
      userPosts.forEach(post => {
        if (post.isLiked) {
          liked.add(post.id);
        }
      });
      setLikedPosts(liked);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load your posts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId) => {
    const isLiked = likedPosts.has(postId);
    
    try {
      if (isLiked) {
        await api.unlike(postId);
        setLikedPosts(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: Math.max(0, post.likes - 1) }
            : post
        ));
      } else {
        await api.like(postId);
        setLikedPosts(prev => new Set(prev).add(postId));
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCommentPress = (post) => {
    navigation.navigate('Comment', { postId: post.id });
  };

  const handleShare = async (postId, postContent, postAuthor) => {
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
              await fetchMyPosts();
            } catch (error) {
              console.error('Error sharing post:', error);
              Alert.alert('Error', 'Could not share post');
            }
          }
        }
      ]
    );
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
              setPosts(prev => prev.filter(post => post.id !== postId));
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

  const handlePostOptions = (post) => {
    Alert.alert(
      'Post Options',
      null,
      [
        { 
          text: 'Delete Post', 
          style: 'destructive',
          onPress: () => handleDeletePost(post.id)
        },
        { 
          text: 'Share Post',
          onPress: () => handleShare(post.id, post.content, post.user?.name)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderPost = useCallback(({ item }) => {
    const isLiked = likedPosts.has(item.id);
    
    return (
      <View style={styles.feedCard}>
        {/* User Header */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            {item.user?.avatarUrl && !item.user.avatarUrl.includes('ui-avatars.com') ? (
              <Image 
                source={{ uri: item.user.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.postAvatarPlaceholder}>
                <Ionicons name="person-circle" size={40} color="#65676B" />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.user?.name || 'You'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.postTime}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
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
            <View style={styles.sharedPostHeader}>
              {item.sharedPost.user.avatarUrl && !item.sharedPost.user.avatarUrl.includes('ui-avatars.com') ? (
                <Image 
                  source={{ uri: item.sharedPost.user.avatarUrl }}
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
            </View>
            
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
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
        ) : null}

        {/* Engagement Stats */}
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

        {/* Action Buttons */}
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
              name="chatbubble-ellipses-outline" 
              size={20} 
              color="#65676B"
              style={styles.actionIconSpacing}
            />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(item.id, item.content, item.user?.name)}
            activeOpacity={0.6}
          >
            <Ionicons 
              name="share-outline" 
              size={20} 
              color="#65676B"
              style={styles.actionIconSpacing}
            />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [likedPosts]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Posts</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Posts List */}
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Share your first post with the community</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRight: {
    width: moderateScale(40),
  },
  listContent: {
    paddingVertical: verticalScale(8),
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: verticalScale(8),
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(12),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
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
  },
  postAvatarPlaceholder: {
    width: moderateScale(40),
    height: moderateScale(40),
    marginRight: getSpacing(10),
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(2),
  },
  postTime: {
    fontSize: getFontSize(13),
    color: '#65676B',
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
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing(12),
    paddingVertical: verticalScale(8),
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  reactionBubbleLike: {
    backgroundColor: '#0866FF',
  },
  reactionBubbleHeart: {
    backgroundColor: '#F02849',
  },
  statsText: {
    fontSize: getFontSize(13),
    color: '#65676B',
    marginLeft: getSpacing(4),
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: getSpacing(4),
    paddingVertical: verticalScale(4),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(8),
  },
  actionIconSpacing: {
    marginRight: getSpacing(6),
  },
  actionText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#65676B',
  },
  actionTextLiked: {
    color: COLORS.primary,
  },
  actionDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E4E6EB',
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(100),
  },
  emptyText: {
    fontSize: getFontSize(18),
    fontWeight: '600',
    color: '#65676B',
    marginTop: verticalScale(16),
  },
  emptySubtext: {
    fontSize: getFontSize(14),
    color: '#8E8E93',
    marginTop: verticalScale(8),
  },
});
