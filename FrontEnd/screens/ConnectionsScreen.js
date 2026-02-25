import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, fixImageUrl } from '../lib/api';
import { generateAvatarUrl } from '../utils/avatarHelper';
import { COLORS } from '../constants/colors';
import {
  verticalScale,
  moderateScale,
  getFontSize,
  getSpacing,
  getBorderRadius,
} from '../utils/responsive';

export default function ConnectionsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('connections'); // 'connections' or 'requests'
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching connections and requests...');
      const [connectionsRes, requestsRes] = await Promise.all([
        api.getConnections(),
        api.getPendingRequests(),
      ]);
      
      console.log('Connections:', connectionsRes);
      console.log('Pending requests:', requestsRes);
      
      setConnections(connectionsRes.connections || []);
      setPendingRequests(requestsRes.requests || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      Alert.alert('Error', 'Failed to load connections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAcceptRequest = async (connectionId) => {
    if (actionLoading[connectionId]) return;
    
    try {
      setActionLoading({ ...actionLoading, [connectionId]: true });
      await api.acceptConnectionRequest(connectionId);
      Alert.alert('Success', 'Connection request accepted!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept connection request');
    } finally {
      setActionLoading({ ...actionLoading, [connectionId]: false });
    }
  };

  const handleRejectRequest = async (connectionId) => {
    if (actionLoading[connectionId]) return;
    
    try {
      setActionLoading({ ...actionLoading, [connectionId]: true });
      await api.rejectConnectionRequest(connectionId);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject connection request');
    } finally {
      setActionLoading({ ...actionLoading, [connectionId]: false });
    }
  };

  const handleRemoveConnection = async (connectionId, userName) => {
    Alert.alert(
      'Remove Connection',
      `Are you sure you want to remove ${userName} from your connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading({ ...actionLoading, [connectionId]: true });
              await api.removeConnection(connectionId);
              Alert.alert('Success', 'Connection removed');
              fetchData();
            } catch (error) {
              console.error('Error removing connection:', error);
              Alert.alert('Error', 'Failed to remove connection');
            } finally {
              setActionLoading({ ...actionLoading, [connectionId]: false });
            }
          },
        },
      ]
    );
  };

  const handleViewProfile = (userId) => {
    navigation.navigate('UserProfile', { userId });
  };

  const handleMessage = (userId, userName, userAvatar, userDepartment) => {
    navigation.navigate('ChatConversation', { 
      userId, 
      userName,
      userAvatar,
      userDepartment
    });
  };

  const renderConnectionItem = (connection) => {
    const user = connection.user;
    
    return (
      <View key={connection.connection_id} style={styles.connectionCard}>
        <TouchableOpacity
          style={styles.connectionInfo}
          onPress={() => handleViewProfile(user._id || user.id)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: fixImageUrl(user.avatar_url) || generateAvatarUrl(user.full_name) }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.full_name}</Text>
            <Text style={styles.userTitle}>{user.title || user.department}</Text>
            <Text style={styles.userDepartment}>{user.department}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => handleMessage(
              user._id || user.id, 
              user.full_name, 
              user.avatar_url,
              user.department || user.email
            )}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#6C63FF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveConnection(connection.connection_id, user.full_name)}
          >
            <Ionicons name="person-remove-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRequestItem = (request) => {
    const user = request.user;
    const isLoading = actionLoading[request.connection_id];
    
    return (
      <View key={request.connection_id} style={styles.requestCard}>
        <TouchableOpacity
          style={styles.connectionInfo}
          onPress={() => handleViewProfile(user._id || user.id)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: fixImageUrl(user.avatar_url) || generateAvatarUrl(user.full_name) }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.full_name}</Text>
            <Text style={styles.userTitle}>{user.title || user.department}</Text>
            <Text style={styles.userDepartment}>{user.department}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.acceptButton, isLoading && styles.disabledButton]}
            onPress={() => handleAcceptRequest(request.connection_id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ignoreButton, isLoading && styles.disabledButton]}
            onPress={() => handleRejectRequest(request.connection_id)}
            disabled={isLoading}
          >
            <Text style={styles.ignoreButtonText}>Ignore</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>My Network</Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate('SearchResults')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={24} color="#6C63FF" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
            onPress={() => setActiveTab('connections')}
          >
            <Text style={[styles.tabText, activeTab === 'connections' && styles.activeTabText]}>
              Connections ({connections.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests ({pendingRequests.length})
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']} />
            }
          >
            {activeTab === 'connections' ? (
              <>
                {connections.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyStateTitle}>No connections yet</Text>
                    <Text style={styles.emptyStateText}>
                      Connect with people to grow your network
                    </Text>
                  </View>
                ) : (
                  <View style={styles.listContainer}>
                    {connections.map(renderConnectionItem)}
                  </View>
                )}
              </>
            ) : (
              <>
                {pendingRequests.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="mail-open-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyStateTitle}>No pending requests</Text>
                    <Text style={styles.emptyStateText}>
                      You're all caught up!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.listContainer}>
                    {pendingRequests.map(renderRequestItem)}
                  </View>
                )}
              </>
            )}
            
            <View style={styles.bottomSpace} />
          </ScrollView>
        )}
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
    paddingHorizontal: getSpacing(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228, 230, 235, 0.5)',
  },
  headerTitle: {
    fontSize: getFontSize(24),
    fontWeight: '700',
    color: COLORS.text,
  },
  searchButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: getSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228, 230, 235, 0.5)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: getSpacing(6),
  },
  activeTab: {
    borderBottomColor: '#6C63FF',
  },
  tabText: {
    fontSize: getFontSize(15),
    fontWeight: '500',
    color: '#65676B',
  },
  activeTabText: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getSpacing(6),
  },
  badgeText: {
    fontSize: getFontSize(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: getSpacing(16),
    paddingTop: verticalScale(16),
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(12),
    marginBottom: verticalScale(12),
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(12),
    marginBottom: verticalScale(12),
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#E5E7EB',
    marginRight: getSpacing(12),
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: verticalScale(2),
  },
  userTitle: {
    fontSize: getFontSize(13),
    color: '#6C63FF',
    marginBottom: verticalScale(2),
  },
  userDepartment: {
    fontSize: getFontSize(12),
    color: '#65676B',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: getSpacing(8),
  },
  messageButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: getSpacing(12),
    marginTop: verticalScale(12),
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: getBorderRadius(8),
    paddingVertical: verticalScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ignoreButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: getBorderRadius(8),
    paddingVertical: verticalScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ignoreButtonText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#EF4444',
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(80),
    paddingHorizontal: getSpacing(40),
  },
  emptyStateTitle: {
    fontSize: getFontSize(18),
    fontWeight: '600',
    color: COLORS.text,
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  emptyStateText: {
    fontSize: getFontSize(14),
    color: '#65676B',
    textAlign: 'center',
    lineHeight: getFontSize(20),
  },
  bottomSpace: {
    height: verticalScale(100),
  },
});
