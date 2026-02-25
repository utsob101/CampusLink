import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
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

export default function HomeScreen({ navigation }) {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for demonstration
  const activeProjects = [
    {
      id: 1,
      title: 'Mobile App Development',
      members: 4,
      category: 'Development',
      deadline: '2 weeks',
    },
    {
      id: 2,
      title: 'Marketing Campaign',
      members: 3,
      category: 'Marketing',
      deadline: '1 month',
    },
  ];

  const suggestedConnections = [
    {
      id: 1,
      name: 'Sarah Johnson',
      major: 'Computer Science',
      year: 'Junior',
      skills: ['React', 'Python'],
    },
    {
      id: 2,
      name: 'Michael Chen',
      major: 'Business',
      year: 'Senior',
      skills: ['Marketing', 'Design'],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {profile?.full_name?.split(' ')[0] || 'there'} 👋</Text>
            <Text style={styles.headerSubtitle}>Welcome back to CampusLink</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for projects, teammates..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>➕</Text>
              <Text style={styles.quickActionText}>Create Project</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>🔍</Text>
              <Text style={styles.quickActionText}>Find Teammates</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>Messages</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Active Projects</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {activeProjects.length > 0 ? (
            activeProjects.map((project) => (
              <TouchableOpacity key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{project.category}</Text>
                  </View>
                </View>
                <View style={styles.projectFooter}>
                  <Text style={styles.projectMeta}>👥 {project.members} members</Text>
                  <Text style={styles.projectMeta}>⏱️ {project.deadline}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No active projects yet</Text>
              <TouchableOpacity style={styles.createButton}>
                <Text style={styles.createButtonText}>Create Your First Project</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Suggested Connections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Connections</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.connectionsScroll}
          >
            {suggestedConnections.map((person) => (
              <TouchableOpacity key={person.id} style={styles.connectionCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <Text style={styles.connectionName}>{person.name}</Text>
                <Text style={styles.connectionInfo}>
                  {person.major} • {person.year}
                </Text>
                <View style={styles.skillsContainer}>
                  {person.skills.slice(0, 2).map((skill, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.connectButton}>
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: verticalScale(24),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: getSpacing(24),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + verticalScale(20) : verticalScale(20),
    paddingBottom: verticalScale(20),
    backgroundColor: COLORS.background,
  },
  greeting: {
    fontSize: getFontSize(24),
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    fontSize: getFontSize(14),
    color: COLORS.textSecondary,
  },
  notificationButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: getFontSize(20),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginHorizontal: getSpacing(24),
    marginBottom: verticalScale(20),
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(12),
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: getFontSize(18),
    marginRight: getSpacing(8),
  },
  searchInput: {
    flex: 1,
    fontSize: getFontSize(16),
    color: COLORS.text,
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing(24),
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: getFontSize(18),
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: getFontSize(14),
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: getSpacing(24),
    gap: getSpacing(12),
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: verticalScale(20),
    paddingHorizontal: getSpacing(12),
    borderRadius: getBorderRadius(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    fontSize: getFontSize(28),
    marginBottom: verticalScale(8),
  },
  quickActionText: {
    fontSize: getFontSize(12),
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  projectCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: getSpacing(24),
    padding: getSpacing(16),
    borderRadius: getBorderRadius(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  projectTitle: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: getSpacing(10),
    paddingVertical: verticalScale(4),
    borderRadius: getBorderRadius(12),
    marginLeft: getSpacing(8),
  },
  categoryText: {
    fontSize: getFontSize(12),
    color: COLORS.primary,
    fontWeight: '500',
  },
  projectFooter: {
    flexDirection: 'row',
    gap: getSpacing(16),
  },
  projectMeta: {
    fontSize: getFontSize(14),
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: getSpacing(24),
    paddingVertical: verticalScale(32),
  },
  emptyStateText: {
    fontSize: getFontSize(16),
    color: COLORS.textSecondary,
    marginBottom: verticalScale(16),
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: getSpacing(24),
    paddingVertical: verticalScale(12),
    borderRadius: getBorderRadius(8),
  },
  createButtonText: {
    color: COLORS.textLight,
    fontSize: getFontSize(14),
    fontWeight: '600',
  },
  connectionsScroll: {
    paddingLeft: getSpacing(24),
  },
  connectionCard: {
    backgroundColor: COLORS.background,
    width: moderateScale(160),
    padding: getSpacing(16),
    borderRadius: getBorderRadius(12),
    marginRight: getSpacing(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },
  avatarText: {
    fontSize: getFontSize(20),
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  connectionName: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: verticalScale(4),
    textAlign: 'center',
  },
  connectionInfo: {
    fontSize: getFontSize(12),
    color: COLORS.textSecondary,
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(4),
    marginBottom: verticalScale(12),
    justifyContent: 'center',
  },
  skillBadge: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: getSpacing(8),
    paddingVertical: verticalScale(4),
    borderRadius: getBorderRadius(8),
  },
  skillText: {
    fontSize: getFontSize(10),
    color: COLORS.text,
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: getSpacing(16),
    paddingVertical: verticalScale(8),
    borderRadius: getBorderRadius(8),
    width: '100%',
  },
  connectButtonText: {
    color: COLORS.textLight,
    fontSize: getFontSize(12),
    fontWeight: '600',
    textAlign: 'center',
  },
});

