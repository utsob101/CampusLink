import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { generateAvatarUrl } from '../utils/avatarHelper';
import { api } from '../lib/api';
import { COLORS } from '../constants/colors';
import {
  verticalScale,
  moderateScale,
  getFontSize,
  getSpacing,
  getBorderRadius,
  getScreenWidth,
  getScreenHeight
} from '../utils/responsive';

export default function ChatConversationScreen({ navigation, route }) {
  const { userId, userName, userAvatar, userDepartment } = route.params;
  const { user, profile, isDemo, canWrite } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (userId && user) {
      loadMessages();
    }
  }, [userId, user]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      console.log('[ChatConversation] Loading messages with user:', userId);
      
      const response = await api.getConversation(userId);
      console.log('[ChatConversation] Loaded messages:', response);
      
      if (response.messages) {
        const formattedMessages = response.messages.map(msg => ({
          id: msg.id,
          text: msg.content,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderAvatar: msg.sender_avatar,
          timestamp: formatTime(msg.created_at),
          isOwn: msg.is_own,
          created_at: msg.created_at,
        }));
        
        setMessages(formattedMessages);
        
        // Scroll to bottom after loading
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('[ChatConversation] Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const sendMessage = async () => {
    if (message.trim() === '' || !user) return;
    
    // Check if user is in demo mode
    if (!canWrite()) {
      Alert.alert('Demo Mode', 'You cannot send messages in demo mode. Please login to send messages.');
      return;
    }

    const messageText = message.trim();
    setMessage('');

    try {
      console.log('[ChatConversation] Sending message to:', userId);
      
      // Send message to backend
      const response = await api.sendMessage(userId, messageText);
      console.log('[ChatConversation] Message sent:', response);
      
      if (response.message) {
        // Add message to local state
        const newMessage = {
          id: response.message.id,
          text: response.message.content,
          senderId: response.message.sender_id,
          senderName: response.message.sender_name || profile?.full_name || 'You',
          timestamp: formatTime(response.message.created_at),
          isOwn: true,
          created_at: response.message.created_at,
        };

        setMessages(prev => [...prev, newMessage]);

        // Auto scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('[ChatConversation] Error sending message:', error);
      
      Alert.alert('Error', 'Could not send message. Please try again.');
      // Restore message text on error
      setMessage(messageText);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={{ alignSelf: item.isOwn ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
      <View
        style={[
          styles.messageContainer,
          item.isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!item.isOwn && (
          <Image
            source={{ uri: item.senderAvatar || userAvatar || generateAvatarUrl(item.senderName || userName) }}
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            item.isOwn ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.isOwn ? styles.ownText : styles.otherText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
      <Text style={[styles.messageTime, item.isOwn ? { textAlign: 'right' } : { textAlign: 'left', marginLeft: moderateScale(40) }]}>
        {item.timestamp}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyMessagesContainer}>
      <Ionicons name="chatbubble-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyMessagesTitle}>Start the conversation</Text>
      <Text style={styles.emptyMessagesText}>
        Send a message to {userName}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Demo Mode Banner */}
      {isDemo() && (
        <View style={styles.demoBanner}>
          <Ionicons name="information-circle" size={20} color="#FFFFFF" />
          <Text style={styles.demoBannerText}>Demo Mode - Read Only Chat</Text>
        </View>
      )}
      
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
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Image
              source={{ uri: userAvatar || generateAvatarUrl(userName) }}
              style={styles.headerAvatar}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName}>{userName}</Text>
              <Text style={styles.headerStatus}>{userDepartment || 'Connection'}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('UserProfile', { userId })}
          >
            <Ionicons name="information-circle-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesListContainer}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyMessagesList
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, !canWrite() && styles.disabledInput]}
              placeholder={canWrite() ? "Type a message..." : "Demo Mode - Cannot Send Messages"}
              value={message}
              onChangeText={canWrite() ? setMessage : undefined}
              multiline
              maxLength={1000}
              placeholderTextColor="#9CA3AF"
              selectionColor="#6C63FF"
              editable={canWrite()}
            />
          </View>

          {message.trim() && canWrite() && (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6C63FF', '#5B52E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const width = getScreenWidth();
const height = getScreenHeight();

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
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: '#DDD6FE',
    opacity: 0.5,
    top: -width * 0.7,
    right: -width * 0.5,
  },
  purpleShape2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: '#C4B5FD',
    opacity: 0.4,
    bottom: -width * 0.5,
    left: -width * 0.4,
  },
  purpleShape3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#DDD6FE',
    opacity: 0.45,
    top: height * 0.4,
    right: -50,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228, 230, 235, 0.5)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: 12,
    color: '#65676B',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesListContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyMessagesList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyMessagesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyMessagesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  messageAvatar: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    marginRight: getSpacing(8),
    backgroundColor: '#E5E7EB',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  ownBubble: {
    backgroundColor: '#1877F2',
    borderBottomRightRadius: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  otherBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 11,
    color: '#65676B',
    marginTop: 4,
    marginHorizontal: 12,
  },
  keyboardAvoidingView: {
    flex: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: getSpacing(16),
    paddingTop: verticalScale(8),
    paddingBottom: Platform.OS === 'android' ? verticalScale(12) : verticalScale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(108, 99, 255, 0.1)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
    borderRadius: getBorderRadius(25),
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(8),
    minHeight: moderateScale(48),
    maxHeight: moderateScale(100),
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  input: {
    flex: 1,
    fontSize: getFontSize(17),
    color: COLORS.text,
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
    maxHeight: moderateScale(100),
    minHeight: moderateScale(40),
    outlineStyle: 'none',
    lineHeight: verticalScale(20),
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  sendButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    marginLeft: getSpacing(12),
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Demo Mode Styles
  demoBanner: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'android' ? 25 : 0,
  },
  demoBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledInput: {
    opacity: 0.5,
    backgroundColor: '#E4E6EB',
  },
});
