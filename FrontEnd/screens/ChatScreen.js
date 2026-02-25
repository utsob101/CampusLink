import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { generateAvatarUrl } from '../utils/avatarHelper';
import { COLORS } from '../constants/colors';
import { 
  verticalScale, 
  moderateScale, 
  getFontSize, 
  getSpacing, 
  getBorderRadius
} from '../utils/responsive';

export default function ChatScreen({ navigation }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      console.log('[Chat] Fetching conversations...');
      const response = await api.getConversations();
      setConversations(response.conversations || []);
      console.log('[Chat] Loaded', response.conversations?.length || 0, 'conversations');
    } catch (error) {
      console.error('[Chat] Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const userName = conv.user?.full_name || '';
    return userName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderChatItem = ({ item }) => {
    const chatUser = item.user;
    if (!chatUser) return null;

    const lastMessage = item.last_message;
    const unreadCount = item.unread_count || 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('ChatConversation', { 
          userId: chatUser.id || chatUser._id,
          userName: chatUser.full_name,
          userAvatar: chatUser.avatar_url,
          userDepartment: chatUser.email
        })}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: chatUser.avatar_url || generateAvatarUrl(chatUser.full_name) }}
          style={styles.avatar}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{chatUser.full_name}</Text>
            <Text style={styles.chatTime}>
              {lastMessage?.created_at ? formatTime(lastMessage.created_at) : ''}
            </Text>
          </View>
          <View style={styles.lastMessageContainer}>
            <Text 
              style={[
                styles.chatMessage, 
                unreadCount > 0 && styles.unreadMessage
              ]} 
              numberOfLines={1}
            >
              {lastMessage?.is_own ? 'You: ' : ''}
              {lastMessage?.content || 'Start conversation'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chatbubble-outline" size={20} color="#6C63FF" />
      </TouchableOpacity>
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

    const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Conversations Yet</Text>
      <Text style={styles.emptyText}>
        Search for users to start a conversation
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Background */}
      <LinearGradient
        colors={['#EEF2FF', '#F9FAFB', '#FFFFFF']}
        style={styles.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('SearchResults')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add-outline" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search connections..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chat List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : filteredConversations.length === 0 && searchQuery.length === 0 ? (
        renderEmptyState()
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Results</Text>
          <Text style={styles.emptyText}>
            No conversations found matching "{searchQuery}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderChatItem}
          keyExtractor={(item, index) => item.user?.id || item.user?._id || index.toString()}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(16),
    paddingVertical: getSpacing(12),
  },
  headerTitle: {
    fontSize: getFontSize(28),
    fontWeight: '700',
    color: '#1F2937',
  },
  searchButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    paddingHorizontal: getSpacing(16),
    marginBottom: getSpacing(8),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: getBorderRadius(12),
    paddingHorizontal: getSpacing(12),
    paddingVertical: getSpacing(10),
    gap: getSpacing(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: getFontSize(15),
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  loadingText: {
    fontSize: getFontSize(14),
    color: '#6B7280',
    marginTop: getSpacing(12),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getSpacing(32),
  },
  emptyTitle: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: '#1F2937',
    marginTop: getSpacing(16),
    marginBottom: getSpacing(8),
  },
  emptyText: {
    fontSize: getFontSize(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: getSpacing(24),
  },
  connectButton: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  connectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(8),
    paddingHorizontal: getSpacing(24),
    paddingVertical: getSpacing(12),
    borderRadius: getBorderRadius(12),
  },
  connectButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatList: {
    paddingHorizontal: getSpacing(16),
    paddingBottom: getSpacing(20),
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(12),
    marginBottom: getSpacing(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#E5E7EB',
  },
  chatInfo: {
    flex: 1,
    marginLeft: getSpacing(12),
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(4),
  },
  chatName: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#1F2937',
  },
  chatTime: {
    fontSize: getFontSize(12),
    color: '#9CA3AF',
  },
  chatMessage: {
    fontSize: getFontSize(14),
    color: '#6B7280',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#1F2937',
  },
  unreadBadge: {
    backgroundColor: '#6C63FF',
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    paddingHorizontal: getSpacing(6),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: getSpacing(8),
  },
  unreadText: {
    fontSize: getFontSize(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
