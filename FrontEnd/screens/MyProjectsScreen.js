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
  useWindowDimensions,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { api } from '../lib/api';
import {
  moderateScale,
  verticalScale,
  getFontSize,
  getSpacing,
  getBorderRadius,
  getScreenWidth,
  getScreenHeight,
  isSmallDevice,
} from '../utils/responsive';

export default function MyProjectsScreen({ navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Active'); // Active, Completed, Archived
  
  // New project form
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: 'Academic',
    status: 'In Progress',
    skills: '',
    github_url: '',
    demo_url: '',
    team_size: '1',
  });

  useEffect(() => {
    fetchProjects();
  }, [selectedTab]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Map tab to status
      let status = null;
      if (selectedTab === 'Active') {
        status = 'In Progress';
      } else if (selectedTab === 'Completed') {
        status = 'Completed';
      } else if (selectedTab === 'Archived') {
        status = 'On Hold'; // Map Archived to On Hold
      }
      
      const { projects: data } = await api.getMyProjects(status);
      setProjects(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      Alert.alert('Error', 'Failed to fetch projects');
      setProjects([]);
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.title.trim()) {
      Alert.alert('Error', 'Please enter a project title');
      return;
    }

    try {
      const projectData = {
        title: newProject.title,
        description: newProject.description,
        category: newProject.category,
        status: newProject.status,
        skills: newProject.skills.split(',').map(s => s.trim()).filter(Boolean),
        github_url: newProject.github_url,
        demo_url: newProject.demo_url,
        team_size: parseInt(newProject.team_size) || 1,
      };

      await api.createProject(projectData);

      Alert.alert('Success', 'Project created successfully!');
      setModalVisible(false);
      setNewProject({
        title: '',
        description: '',
        category: 'Academic',
        status: 'In Progress',
        skills: '',
        github_url: '',
        demo_url: '',
        team_size: '1',
      });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', error.message || 'Failed to create project. Please try again.');
    }
  };

  const deleteProject = async (projectId) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteProject(projectId);
              Alert.alert('Success', 'Project deleted successfully');
              fetchProjects();
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const categories = ['Academic', 'Personal', 'Freelance', 'Open Source', 'Hackathon'];
  const statuses = ['Planning', 'In Progress', 'Completed', 'On Hold'];

  const getCategoryIcon = (category) => {
    const icons = {
      Academic: '🎓',
      Personal: '💡',
      Freelance: '💼',
      'Open Source': '🌐',
      Hackathon: '🏆',
    };
    return icons[category] || '📁';
  };

  const getStatusColor = (status) => {
    const colors = {
      Planning: '#3B82F6',
      'In Progress': '#F59E0B',
      Completed: '#10B981',
      'On Hold': '#6B7280',
    };
    return colors[status] || '#6B7280';
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Gradient Background */}
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientShape1} />
        <View style={styles.gradientShape2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Projects</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>{projects.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#F59E0B', '#F97316']}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>
              {projects.filter(p => p.status === 'In Progress').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>
              {projects.filter(p => p.status === 'Completed').length}
            </Text>
            <Text style={styles.statLabel}>Done</Text>
          </LinearGradient>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['Active', 'Completed', 'Archived'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && styles.tabActive,
              ]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Projects List */}
        <ScrollView
          style={styles.projectsList}
          contentContainerStyle={styles.projectsContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Loading projects...</Text>
            </View>
          ) : projects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyTitle}>No Projects Yet</Text>
              <Text style={styles.emptyText}>
                Create your first project to showcase your work
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.emptyButtonGradient}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Create Project</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            projects.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectTitleRow}>
                    <Text style={styles.projectCategory}>
                      {getCategoryIcon(project.category)} {project.category}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(project.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{project.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {project.description || 'No description'}
                  </Text>
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
                      <Text style={styles.moreSkills}>
                        +{project.skills.length - 3}
                      </Text>
                    )}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.projectActions}>
                  {project.github_url && (
                    <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                      <Ionicons name="logo-github" size={18} color="#6366F1" />
                      <Text style={styles.actionButtonText}>GitHub</Text>
                    </TouchableOpacity>
                  )}
                  {project.demo_url && (
                    <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                      <Ionicons name="globe-outline" size={18} color="#6366F1" />
                      <Text style={styles.actionButtonText}>Demo</Text>
                    </TouchableOpacity>
                  )}
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteProject(project.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.projectFooter}>
                  <View style={styles.teamInfo}>
                    <Ionicons name="people-outline" size={14} color="#6B7280" />
                    <Text style={styles.teamText}>
                      {project.team_size} {project.team_size === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                  <Text style={styles.projectDate}>
                    {new Date(project.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Create Project Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Project</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Project Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter project title"
                value={newProject.title}
                onChangeText={(text) => setNewProject({ ...newProject, title: text })}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your project"
                value={newProject.description}
                onChangeText={(text) => setNewProject({ ...newProject, description: text })}
                multiline
                numberOfLines={2}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      newProject.category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setNewProject({ ...newProject, category: cat })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        newProject.category === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {getCategoryIcon(cat)} {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.categoriesContainer}>
                {statuses.map((stat) => (
                  <TouchableOpacity
                    key={stat}
                    style={[
                      styles.categoryChip,
                      newProject.status === stat && styles.categoryChipActive,
                    ]}
                    onPress={() => setNewProject({ ...newProject, status: stat })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        newProject.status === stat && styles.categoryChipTextActive,
                      ]}
                    >
                      {stat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Skills (comma-separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="React, Node.js, MongoDB"
                value={newProject.skills}
                onChangeText={(text) => setNewProject({ ...newProject, skills: text })}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>GitHub URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://github.com/..."
                value={newProject.github_url}
                onChangeText={(text) => setNewProject({ ...newProject, github_url: text })}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Demo URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={newProject.demo_url}
                onChangeText={(text) => setNewProject({ ...newProject, demo_url: text })}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Team Size</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={newProject.team_size}
                onChangeText={(text) => setNewProject({ ...newProject, team_size: text })}
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={styles.createButton}
                onPress={createProject}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.createButtonGradient}
                >
                  <Text style={styles.createButtonText}>Create Project</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SCREEN_WIDTH = getScreenWidth();
const SCREEN_HEIGHT = getScreenHeight();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(300),
  },
  gradientShape1: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: SCREEN_WIDTH * 0.6,
    backgroundColor: '#EEF2FF',
    top: -SCREEN_WIDTH * 0.5,
    right: -SCREEN_WIDTH * 0.3,
  },
  gradientShape2: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: '#F3E8FF',
    top: -SCREEN_WIDTH * 0.2,
    left: -SCREEN_WIDTH * 0.2,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing(16),
    paddingVertical: getSpacing(16),
    zIndex: 10,
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
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
    fontSize: getFontSize(24),
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: getSpacing(16),
  },
  addButton: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonGradient: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: isSmallDevice ? getSpacing(12) : getSpacing(16),
    marginBottom: getSpacing(16),
    gap: isSmallDevice ? getSpacing(6) : getSpacing(8),
  },
  statCard: {
    flex: 1,
    paddingHorizontal: isSmallDevice ? getSpacing(6) : getSpacing(8),
    paddingVertical: isSmallDevice ? getSpacing(10) : getSpacing(12),
    borderRadius: getBorderRadius(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  statNumber: {
    fontSize: isSmallDevice ? getFontSize(18) : getFontSize(22),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: getSpacing(2),
  },
  statLabel: {
    fontSize: isSmallDevice ? getFontSize(9) : getFontSize(10),
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: isSmallDevice ? getSpacing(12) : getSpacing(16),
    marginBottom: getSpacing(16),
    gap: isSmallDevice ? getSpacing(6) : getSpacing(8),
  },
  tab: {
    flex: 1,
    paddingVertical: getSpacing(10),
    borderRadius: getBorderRadius(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  projectsList: {
    flex: 1,
    paddingHorizontal: isSmallDevice ? getSpacing(12) : getSpacing(16),
  },
  projectsContent: {
    paddingBottom: getSpacing(20),
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: getBorderRadius(16),
    padding: isSmallDevice ? getSpacing(12) : getSpacing(16),
    marginBottom: getSpacing(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    maxHeight: isSmallDevice ? moderateScale(260) : moderateScale(280),
  },
  projectHeader: {
    marginBottom: getSpacing(12),
  },
  projectTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(8),
  },
  projectCategory: {
    fontSize: getFontSize(13),
    fontWeight: '600',
    color: '#6366F1',
  },
  statusBadge: {
    paddingHorizontal: getSpacing(10),
    paddingVertical: getSpacing(4),
    borderRadius: getBorderRadius(12),
  },
  statusText: {
    fontSize: getFontSize(11),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  projectTitle: {
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: getSpacing(6),
  },
  projectDescription: {
    fontSize: getFontSize(14),
    color: '#6B7280',
    lineHeight: getFontSize(20),
    maxHeight: getFontSize(40),
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(6),
    marginBottom: getSpacing(12),
  },
  skillTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: getSpacing(10),
    paddingVertical: getSpacing(4),
    borderRadius: getBorderRadius(8),
  },
  skillText: {
    fontSize: getFontSize(12),
    fontWeight: '500',
    color: '#6366F1',
  },
  moreSkills: {
    fontSize: getFontSize(12),
    fontWeight: '600',
    color: '#9CA3AF',
    paddingHorizontal: getSpacing(6),
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(8),
    marginBottom: getSpacing(12),
    paddingTop: getSpacing(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(4),
    paddingHorizontal: getSpacing(12),
    paddingVertical: getSpacing(6),
    borderRadius: getBorderRadius(8),
    backgroundColor: '#EEF2FF',
  },
  actionButtonText: {
    fontSize: getFontSize(12),
    fontWeight: '600',
    color: '#6366F1',
  },
  deleteButton: {
    padding: getSpacing(6),
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(4),
  },
  teamText: {
    fontSize: getFontSize(12),
    color: '#6B7280',
  },
  projectDate: {
    fontSize: getFontSize(12),
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(60),
  },
  emptyIcon: {
    fontSize: getFontSize(64),
    marginBottom: getSpacing(16),
  },
  emptyTitle: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: getSpacing(8),
  },
  emptyText: {
    fontSize: getFontSize(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: getSpacing(20),
  },
  emptyButton: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(8),
    paddingHorizontal: getSpacing(24),
    paddingVertical: getSpacing(12),
    borderRadius: getBorderRadius(12),
  },
  emptyButtonText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: getBorderRadius(24),
    borderTopRightRadius: getBorderRadius(24),
    paddingTop: isSmallDevice ? getSpacing(14) : getSpacing(18),
    height: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallDevice ? getSpacing(16) : getSpacing(20),
    marginBottom: isSmallDevice ? getSpacing(8) : getSpacing(12),
    paddingBottom: isSmallDevice ? getSpacing(8) : getSpacing(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: isSmallDevice ? getFontSize(18) : getFontSize(20),
    fontWeight: '700',
    color: '#1F2937',
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: isSmallDevice ? getSpacing(14) : getSpacing(18),
  },
  inputLabel: {
    fontSize: isSmallDevice ? getFontSize(12) : getFontSize(13),
    fontWeight: '600',
    color: '#374151',
    marginBottom: isSmallDevice ? getSpacing(4) : getSpacing(6),
    marginTop: isSmallDevice ? getSpacing(6) : getSpacing(8),
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: getBorderRadius(10),
    paddingHorizontal: isSmallDevice ? getSpacing(10) : getSpacing(14),
    paddingVertical: isSmallDevice ? getSpacing(8) : getSpacing(10),
    fontSize: isSmallDevice ? getFontSize(13) : getFontSize(14),
    color: '#1F2937',
  },
  textArea: {
    height: isSmallDevice ? verticalScale(50) : verticalScale(70),
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isSmallDevice ? getSpacing(4) : getSpacing(6),
    marginBottom: isSmallDevice ? getSpacing(4) : getSpacing(6),
  },
  categoryChip: {
    paddingHorizontal: isSmallDevice ? getSpacing(8) : getSpacing(10),
    paddingVertical: isSmallDevice ? getSpacing(4) : getSpacing(5),
    borderRadius: getBorderRadius(10),
    backgroundColor: '#F3F4F6',
  },
  categoryChipActive: {
    backgroundColor: '#6366F1',
  },
  categoryChipText: {
    fontSize: isSmallDevice ? getFontSize(10) : getFontSize(11),
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  createButton: {
    marginTop: isSmallDevice ? getSpacing(12) : getSpacing(16),
    marginBottom: isSmallDevice ? getSpacing(16) : getSpacing(24),
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonGradient: {
    paddingVertical: isSmallDevice ? getSpacing(10) : getSpacing(14),
    borderRadius: getBorderRadius(12),
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: isSmallDevice ? getFontSize(14) : getFontSize(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
