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
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { generateAvatarUrl } from '../utils/avatarHelper';
import {
  verticalScale,
  moderateScale,
  getFontSize,
  getSpacing,
  getBorderRadius,
} from '../utils/responsive';

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchUserProjects();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for:', userId);
      const response = await api.getUserProfile(userId);
      console.log('User profile response:', response);
      setProfile(response.profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserProjects = async () => {
    try {
      setLoadingProjects(true);
      console.log('Fetching projects for user:', userId);
      const response = await api.getUserProjects(userId);
      console.log('User projects response:', response);
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
    fetchUserProjects();
  };

  const handleSendConnectionRequest = async () => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      await api.sendConnectionRequest(userId);
      Alert.alert('Success', 'Connection request sent!');
      fetchUserProfile(); // Refresh to update connection status
    } catch (error) {
      console.error('Error sending connection request:', error);
      Alert.alert('Error', error.message || 'Failed to send connection request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (actionLoading || !profile?.connection_status?.connection_id) return;
    
    try {
      setActionLoading(true);
      await api.acceptConnectionRequest(profile.connection_status.connection_id);
      Alert.alert('Success', 'Connection request accepted!');
      fetchUserProfile();
    } catch (error) {
      console.error('Error accepting connection:', error);
      Alert.alert('Error', 'Failed to accept connection request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (actionLoading || !profile?.connection_status?.connection_id) return;
    
    Alert.alert(
      'Remove Connection',
      'Are you sure you want to remove this connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await api.removeConnection(profile.connection_status.connection_id);
              Alert.alert('Success', 'Connection removed');
              fetchUserProfile();
            } catch (error) {
              console.error('Error removing connection:', error);
              Alert.alert('Error', 'Failed to remove connection');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderConnectionButton = () => {
    const status = profile?.connection_status?.status;
    const isRequester = profile?.connection_status?.is_requester;

    if (status === 'self') {
      return null; // Don't show button for own profile
    }

    if (status === 'accepted') {
      return (
        <View style={styles.connectionButtons}>
          <TouchableOpacity
            style={[styles.connectionButton, styles.connectedButton]}
            onPress={handleRemoveConnection}
            disabled={actionLoading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.connectedButtonText}>Connected</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.connectionButton, styles.messageButton]}
            onPress={() => navigation.navigate('ChatConversation', { 
              userId, 
              userName: profile.full_name,
              userAvatar: profile.avatar_url,
              userDepartment: profile.department || profile.email
            })}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === 'pending') {
      if (isRequester) {
        return (
          <View style={styles.connectionButtons}>
            <TouchableOpacity
              style={[styles.connectionButton, styles.pendingButton]}
              disabled
            >
              <Ionicons name="time-outline" size={20} color="#65676B" />
              <Text style={styles.pendingButtonText}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.connectionButton, styles.messageButton]}
              onPress={() => navigation.navigate('ChatConversation', { 
                userId, 
                userName: profile.full_name,
                userAvatar: profile.avatar_url,
                userDepartment: profile.department || profile.email
              })}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        return (
          <View style={styles.connectionButtons}>
            <TouchableOpacity
              style={[styles.connectionButton, styles.acceptButton]}
              onPress={handleAcceptConnection}
              disabled={actionLoading}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.connectionButton, styles.rejectButton]}
              onPress={handleRemoveConnection}
              disabled={actionLoading}
            >
              <Text style={styles.rejectButtonText}>Ignore</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    // status === 'none' or undefined - show connect + message
    return (
      <View style={styles.connectionButtons}>
        <TouchableOpacity
          style={[styles.connectionButton, styles.connectButton]}
          onPress={handleSendConnectionRequest}
          disabled={actionLoading}
        >
          <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.connectionButton, styles.messageButton]}
          onPress={() => navigation.navigate('ChatConversation', { 
            userId, 
            userName: profile.full_name,
            userAvatar: profile.avatar_url,
            userDepartment: profile.department || profile.email
          })}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']} />
          }
        >
          {/* Profile Header Card */}
          <View style={styles.profileCard}>
            <View style={styles.coverPhoto} />
            
            <View style={styles.profileInfo}>
              <Image
                source={{ uri: profile.avatar_url || generateAvatarUrl(profile.full_name) }}
                style={styles.avatar}
              />
              
              <Text style={styles.name}>{profile.full_name}</Text>
              <Text style={styles.title}>{profile.title || profile.department}</Text>
              <Text style={styles.department}>{profile.department} • Batch {profile.batch}</Text>
              
              {profile.bio && (
                <Text style={styles.bio}>{profile.bio}</Text>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.connections_count}</Text>
                  <Text style={styles.statLabel}>Connections</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.posts_count}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
              </View>

              {renderConnectionButton()}
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              {profile.student_id && (
                <View style={styles.infoRow}>
                  <Ionicons name="card-outline" size={20} color="#6C63FF" />
                  <Text style={styles.infoText}>ID: {profile.student_id}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Ionicons name="school-outline" size={20} color="#6C63FF" />
                <Text style={styles.infoText}>{profile.department}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#6C63FF" />
                <Text style={styles.infoText}>Batch {profile.batch}</Text>
              </View>
              {profile.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color="#6C63FF" />
                  <Text style={styles.infoText}>{profile.phone}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Projects Section */}
          {loadingProjects ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects</Text>
              <View style={styles.loadingSection}>
                <ActivityIndicator size="small" color="#6C63FF" />
              </View>
            </View>
          ) : projects.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects ({projects.length})</Text>
              {projects.slice(0, 3).map((project) => (
                <View key={project.id} style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <View style={styles.projectTitleRow}>
                      <Text style={styles.projectCategory}>
                        {project.category === 'Academic' && '🎓'}
                        {project.category === 'Personal' && '💡'}
                        {project.category === 'Freelance' && '💼'}
                        {project.category === 'Open Source' && '🌐'}
                        {project.category === 'Hackathon' && '🏆'}
                        {' '}{project.category}
                      </Text>
                      <View
                        style={[
                          styles.projectStatusBadge,
                          project.status === 'Completed' && styles.completedBadge,
                          project.status === 'In Progress' && styles.inProgressBadge,
                        ]}
                      >
                        <Text style={styles.projectStatusText}>{project.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    {project.description && (
                      <Text style={styles.projectDescription} numberOfLines={2}>
                        {project.description}
                      </Text>
                    )}
                  </View>

                  {/* Skills */}
                  {project.skills && project.skills.length > 0 && (
                    <View style={styles.skillsContainer}>
                      {project.skills.slice(0, 3).map((skill, index) => (
                        <View key={index} style={styles.skillTag}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                      {project.skills.length > 3 && (
                        <Text style={styles.moreSkills}>+{project.skills.length - 3}</Text>
                      )}
                    </View>
                  )}

                  {/* Project Links */}
                  <View style={styles.projectLinks}>
                    {project.github_url && (
                      <View style={styles.projectLink}>
                        <Ionicons name="logo-github" size={16} color="#6C63FF" />
                        <Text style={styles.projectLinkText}>GitHub</Text>
                      </View>
                    )}
                    {project.demo_url && (
                      <View style={styles.projectLink}>
                        <Ionicons name="globe-outline" size={16} color="#6C63FF" />
                        <Text style={styles.projectLinkText}>Demo</Text>
                      </View>
                    )}
                    {project.team_size > 1 && (
                      <View style={styles.projectLink}>
                        <Ionicons name="people-outline" size={16} color="#6B7280" />
                        <Text style={styles.projectTeamText}>
                          {project.team_size} members
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
              {projects.length > 3 && (
                <Text style={styles.showMoreText}>
                  +{projects.length - 3} more projects
                </Text>
              )}
            </View>
          ) : null}

          {/* Posts Section */}
          {profile.posts && profile.posts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Posts ({profile.posts.length})</Text>
              {profile.posts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <Text style={styles.postCategory}>{post.category}</Text>
                    <Text style={styles.postTime}>
                      {new Date(post.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.postContent}>{post.content}</Text>
                  {post.imageUrl && (
                    <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                  )}
                  <View style={styles.postStats}>
                    <View style={styles.postStat}>
                      <Ionicons name="heart-outline" size={16} color="#65676B" />
                      <Text style={styles.postStatText}>{post.likes}</Text>
                    </View>
                    <View style={styles.postStat}>
                      <Ionicons name="chatbubble-outline" size={16} color="#65676B" />
                      <Text style={styles.postStatText}>{post.comments}</Text>
                    </View>
                    <View style={styles.postStat}>
                      <Ionicons name="share-outline" size={16} color="#65676B" />
                      <Text style={styles.postStatText}>{post.shares}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.bottomSpace} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(12),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228, 230, 235, 0.5)',
  },
  backButton: {
    backgroundColor: '#6C63FF',
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
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
  headerRight: {
    width: moderateScale(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: getFontSize(16),
    color: '#65676B',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: getSpacing(16),
    marginTop: verticalScale(16),
    borderRadius: getBorderRadius(16),
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  coverPhoto: {
    height: verticalScale(100),
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, #6C63FF 0%, #9333EA 100%)',
  },
  profileInfo: {
    alignItems: 'center',
    paddingBottom: verticalScale(24),
  },
  avatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginTop: verticalScale(-50),
    backgroundColor: '#E5E7EB',
  },
  name: {
    fontSize: getFontSize(24),
    fontWeight: '700',
    color: COLORS.text,
    marginTop: verticalScale(12),
  },
  title: {
    fontSize: getFontSize(16),
    fontWeight: '500',
    color: '#6C63FF',
    marginTop: verticalScale(4),
  },
  department: {
    fontSize: getFontSize(14),
    color: '#65676B',
    marginTop: verticalScale(4),
  },
  bio: {
    fontSize: getFontSize(14),
    color: COLORS.text,
    textAlign: 'center',
    marginTop: verticalScale(12),
    marginHorizontal: getSpacing(20),
    lineHeight: getFontSize(20),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(20),
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: getSpacing(24),
  },
  statNumber: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: getFontSize(12),
    color: '#65676B',
    marginTop: verticalScale(4),
  },
  statDivider: {
    width: 1,
    height: moderateScale(40),
    backgroundColor: '#E5E7EB',
  },
  connectionButtons: {
    flexDirection: 'row',
    gap: getSpacing(12),
    marginHorizontal: getSpacing(20),
    width: '100%',
    paddingHorizontal: getSpacing(20),
  },
  connectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: getSpacing(24),
    borderRadius: getBorderRadius(24),
    gap: getSpacing(8),
    flex: 1,
  },
  connectButton: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectedButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  connectedButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#10B981',
  },
  messageButton: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pendingButton: {
    backgroundColor: 'rgba(101, 103, 107, 0.1)',
    borderWidth: 1,
    borderColor: '#65676B',
  },
  pendingButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#65676B',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  acceptButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#EF4444',
  },
  section: {
    marginTop: verticalScale(20),
    paddingHorizontal: getSpacing(16),
  },
  sectionTitle: {
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: verticalScale(12),
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(16),
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    gap: getSpacing(12),
  },
  infoText: {
    fontSize: getFontSize(15),
    color: COLORS.text,
  },
  loadingSection: {
    paddingVertical: verticalScale(20),
    alignItems: 'center',
  },
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(14),
    marginBottom: verticalScale(12),
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  projectHeader: {
    marginBottom: verticalScale(10),
  },
  projectTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  projectCategory: {
    fontSize: getFontSize(12),
    fontWeight: '600',
    color: '#6C63FF',
  },
  projectStatusBadge: {
    paddingHorizontal: getSpacing(8),
    paddingVertical: getSpacing(3),
    borderRadius: getBorderRadius(10),
    backgroundColor: '#E5E7EB',
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
  },
  inProgressBadge: {
    backgroundColor: '#FEF3C7',
  },
  projectStatusText: {
    fontSize: getFontSize(10),
    fontWeight: '600',
    color: '#6B7280',
  },
  projectTitle: {
    fontSize: getFontSize(16),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: verticalScale(4),
  },
  projectDescription: {
    fontSize: getFontSize(13),
    color: '#6B7280',
    lineHeight: getFontSize(18),
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(6),
    marginBottom: verticalScale(10),
  },
  skillTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: getSpacing(8),
    paddingVertical: getSpacing(4),
    borderRadius: getBorderRadius(6),
  },
  skillText: {
    fontSize: getFontSize(11),
    fontWeight: '500',
    color: '#6366F1',
  },
  moreSkills: {
    fontSize: getFontSize(11),
    fontWeight: '600',
    color: '#9CA3AF',
    paddingHorizontal: getSpacing(4),
  },
  projectLinks: {
    flexDirection: 'row',
    gap: getSpacing(12),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
  },
  projectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(4),
  },
  projectLinkText: {
    fontSize: getFontSize(12),
    fontWeight: '500',
    color: '#6C63FF',
  },
  projectTeamText: {
    fontSize: getFontSize(12),
    color: '#6B7280',
  },
  showMoreText: {
    fontSize: getFontSize(13),
    fontWeight: '600',
    color: '#6C63FF',
    textAlign: 'center',
    paddingVertical: verticalScale(8),
  },
  postCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getBorderRadius(12),
    padding: getSpacing(16),
    marginBottom: verticalScale(12),
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  postCategory: {
    fontSize: getFontSize(12),
    fontWeight: '600',
    color: '#6C63FF',
    textTransform: 'uppercase',
  },
  postTime: {
    fontSize: getFontSize(12),
    color: '#65676B',
  },
  postContent: {
    fontSize: getFontSize(15),
    color: COLORS.text,
    lineHeight: getFontSize(22),
    marginBottom: verticalScale(12),
  },
  postImage: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: getBorderRadius(8),
    backgroundColor: '#E5E7EB',
    marginBottom: verticalScale(12),
  },
  postStats: {
    flexDirection: 'row',
    gap: getSpacing(20),
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(4),
  },
  postStatText: {
    fontSize: getFontSize(13),
    color: '#65676B',
  },
  bottomSpace: {
    height: verticalScale(100),
  },
});
