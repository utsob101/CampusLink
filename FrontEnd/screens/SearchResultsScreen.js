import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { generateAvatarUrl } from '../utils/avatarHelper';
import {
  moderateScale,
  verticalScale,
  getFontSize,
  getSpacing,
  getBorderRadius,
  getScreenWidth,
} from '../utils/responsive';

export default function SearchResultsScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState(route.params?.initialQuery || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (route.params?.initialQuery) {
      handleSearch(route.params.initialQuery);
    }
  }, []);

  const handleSearch = async (query = searchQuery) => {
    if (!query || query.trim().length < 2) {
      Alert.alert('Invalid Search', 'Please enter at least 2 characters to search');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      console.log('[SearchResults] Searching for:', query);
      
      const { users } = await api.searchUsers(query.trim(), 50);
      setResults(users || []);
      
      console.log('[SearchResults] Found', users?.length || 0, 'users');
    } catch (error) {
      console.error('[SearchResults] Search error:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId, currentStatus) => {
    if (currentStatus === 'connected') {
      navigation.navigate('UserProfile', { userId });
      return;
    }

    if (currentStatus === 'pending') {
      Alert.alert('Request Pending', 'Your connection request is pending');
      return;
    }

    try {
      await api.sendConnectionRequest(userId);
      Alert.alert('Success', 'Connection request sent!');
      
      // Update the local state
      setResults(results.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              connection_status: { 
                status: 'pending', 
                is_requester: true 
              } 
            }
          : user
      ));
    } catch (error) {
      console.error('[SearchResults] Connect error:', error);
      Alert.alert('Error', error.message || 'Failed to send connection request');
    }
  };

  const getConnectionButtonText = (status) => {
    if (status === 'connected') return 'View Profile';
    if (status === 'pending') return 'Pending';
    return 'Connect';
  };

  const getConnectionButtonStyle = (status) => {
    if (status === 'connected') return styles.connectedButton;
    if (status === 'pending') return styles.pendingButton;
    return styles.connectButton;
  };

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Users</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, department..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus={!route.params?.initialQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setResults([]);
                setHasSearched(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => handleSearch()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.searchButtonGradient}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : !hasSearched ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Search for Users</Text>
            <Text style={styles.emptyText}>
              Find people by name, email, department, or student ID
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptyText}>
              Try searching with different keywords
            </Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            <Text style={styles.resultsCount}>
              {results.length} {results.length === 1 ? 'user' : 'users'} found
            </Text>
            {results.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: user.avatar_url || generateAvatarUrl(user.full_name) }}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.full_name}</Text>
                  <Text style={styles.userDepartment}>
                    {user.department} {user.batch ? `• ${user.batch}` : ''}
                  </Text>
                  {user.bio && (
                    <Text style={styles.userBio} numberOfLines={1}>
                      {user.bio}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={getConnectionButtonStyle(user.connection_status.status)}
                  onPress={() => handleConnect(user.id, user.connection_status.status)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      user.connection_status.status === 'connected' && styles.connectedButtonText,
                      user.connection_status.status === 'pending' && styles.pendingButtonText,
                    ]}
                  >
                    {getConnectionButtonText(user.connection_status.status)}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const SCREEN_WIDTH = getScreenWidth();

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
    paddingHorizontal: getSpacing(16),
    paddingVertical: getSpacing(12),
    backgroundColor: 'transparent',
  },
  backButton: {
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
  headerTitle: {
    flex: 1,
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: getSpacing(12),
  },
  headerSpacer: {
    width: moderateScale(40),
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: getSpacing(16),
    marginBottom: getSpacing(16),
    gap: getSpacing(8),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: getBorderRadius(12),
    paddingHorizontal: getSpacing(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: getSpacing(8),
  },
  searchInput: {
    flex: 1,
    fontSize: getFontSize(15),
    color: '#1F2937',
    paddingVertical: getSpacing(12),
  },
  searchButton: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonGradient: {
    paddingHorizontal: getSpacing(20),
    paddingVertical: getSpacing(12),
    borderRadius: getBorderRadius(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: getSpacing(16),
    paddingBottom: getSpacing(24),
  },
  loadingContainer: {
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
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
    paddingHorizontal: getSpacing(32),
  },
  resultsList: {
    gap: getSpacing(12),
  },
  resultsCount: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: getSpacing(8),
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#E5E7EB',
  },
  userInfo: {
    flex: 1,
    marginLeft: getSpacing(12),
  },
  userName: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: getSpacing(2),
  },
  userDepartment: {
    fontSize: getFontSize(13),
    color: '#6B7280',
    marginBottom: getSpacing(2),
  },
  userBio: {
    fontSize: getFontSize(12),
    color: '#9CA3AF',
  },
  connectButton: {
    paddingHorizontal: getSpacing(16),
    paddingVertical: getSpacing(8),
    borderRadius: getBorderRadius(8),
    backgroundColor: '#6366F1',
  },
  pendingButton: {
    paddingHorizontal: getSpacing(16),
    paddingVertical: getSpacing(8),
    borderRadius: getBorderRadius(8),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  connectedButton: {
    paddingHorizontal: getSpacing(16),
    paddingVertical: getSpacing(8),
    borderRadius: getBorderRadius(8),
    backgroundColor: '#10B981',
  },
  buttonText: {
    fontSize: getFontSize(13),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pendingButtonText: {
    color: '#6B7280',
  },
  connectedButtonText: {
    color: '#FFFFFF',
  },
});
