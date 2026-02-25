import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  scale,
  verticalScale,
  getFontSize,
  getSpacing,
  getBorderRadius,
  isSmallDevice,
  getScreenWidth,
} from '../utils/responsive';

const SCREEN_WIDTH = getScreenWidth();

const TermsPrivacyScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal & Privacy</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => setActiveTab('privacy')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'terms' ? (
          <View style={styles.section}>
            {/* Last Updated */}
            <View style={styles.updateBanner}>
              <Ionicons name="calendar-outline" size={16} color="#6366F1" />
              <Text style={styles.updateText}>Last updated: October 2025</Text>
            </View>

            {/* Terms Section */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="shield-checkmark" size={24} color="#6366F1" />
                <Text style={styles.cardTitle}>Acceptance of Terms</Text>
              </View>
              <Text style={styles.cardText}>
                By accessing and using CampusLink, you agree to be bound by these Terms of Service and all applicable laws and regulations.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle" size={24} color="#8B5CF6" />
                <Text style={styles.cardTitle}>User Accounts</Text>
              </View>
              <Text style={styles.cardText}>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text" size={24} color="#EC4899" />
                <Text style={styles.cardTitle}>Content & Conduct</Text>
              </View>
              <Text style={styles.cardText}>
                Users must not post harmful, offensive, or illegal content. CampusLink reserves the right to remove content that violates our community guidelines.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="ban" size={24} color="#EF4444" />
                <Text style={styles.cardTitle}>Prohibited Activities</Text>
              </View>
              <Text style={styles.cardText}>
                Harassment, spam, impersonation, and unauthorized data collection are strictly prohibited. Violators may face account suspension.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            {/* Last Updated */}
            <View style={styles.updateBanner}>
              <Ionicons name="calendar-outline" size={16} color="#6366F1" />
              <Text style={styles.updateText}>Last updated: October 2025</Text>
            </View>

            {/* Privacy Section */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="lock-closed" size={24} color="#6366F1" />
                <Text style={styles.cardTitle}>Data Collection</Text>
              </View>
              <Text style={styles.cardText}>
                We collect profile information, posts, messages, and usage data to provide and improve our services. All data is encrypted and securely stored.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="eye-off" size={24} color="#8B5CF6" />
                <Text style={styles.cardTitle}>How We Use Your Data</Text>
              </View>
              <Text style={styles.cardText}>
                Your data is used to personalize your experience, connect you with others, and improve our platform. We never sell your personal information to third parties.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="share-social" size={24} color="#EC4899" />
                <Text style={styles.cardTitle}>Data Sharing</Text>
              </View>
              <Text style={styles.cardText}>
                We may share anonymized data for analytics. Personal information is only shared with your explicit consent or as required by law.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="settings" size={24} color="#10B981" />
                <Text style={styles.cardTitle}>Your Rights</Text>
              </View>
              <Text style={styles.cardText}>
                You can access, modify, or delete your data at any time through your account settings. You also have the right to data portability.
              </Text>
            </View>
          </View>
        )}

        {/* Contact Footer */}
        <View style={styles.footer}>
          <Ionicons name="mail" size={20} color="#6B7280" />
          <Text style={styles.footerText}>
            Questions? Email us at{' '}
            <Text style={styles.footerLink}>legal@campuslink.com</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : verticalScale(50),
    paddingBottom: getSpacing(16),
    paddingHorizontal: getSpacing(20),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getSpacing(20),
    paddingVertical: getSpacing(12),
    gap: getSpacing(12),
  },
  tab: {
    flex: 1,
    paddingVertical: isSmallDevice ? getSpacing(10) : getSpacing(12),
    borderRadius: getBorderRadius(12),
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: isSmallDevice ? getFontSize(13) : getFontSize(14),
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: getSpacing(20),
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: getSpacing(12),
    borderRadius: getBorderRadius(10),
    marginBottom: getSpacing(16),
    gap: getSpacing(8),
  },
  updateText: {
    fontSize: getFontSize(13),
    color: '#6366F1',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: getBorderRadius(16),
    padding: isSmallDevice ? getSpacing(14) : getSpacing(16),
    marginBottom: getSpacing(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing(10),
    gap: getSpacing(10),
  },
  cardTitle: {
    fontSize: isSmallDevice ? getFontSize(15) : getFontSize(16),
    fontWeight: '700',
    color: '#1F2937',
  },
  cardText: {
    fontSize: isSmallDevice ? getFontSize(13) : getFontSize(14),
    lineHeight: isSmallDevice ? 20 : 22,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: getSpacing(16),
    marginHorizontal: getSpacing(20),
    marginBottom: getSpacing(20),
    borderRadius: getBorderRadius(12),
    gap: getSpacing(10),
  },
  footerText: {
    flex: 1,
    fontSize: getFontSize(13),
    color: '#6B7280',
  },
  footerLink: {
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default TermsPrivacyScreen;
