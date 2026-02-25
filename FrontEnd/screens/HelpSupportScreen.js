import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
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

const HelpSupportScreen = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const quickActions = [
    {
      id: '1',
      icon: 'mail',
      title: 'Email Support',
      subtitle: 'Get help via email',
      color: '#6366F1',
      action: () => Linking.openURL('mailto:support@campuslink.com'),
    },
    {
      id: '2',
      icon: 'chatbubbles',
      title: 'Live Chat',
      subtitle: 'Chat with us now',
      color: '#8B5CF6',
      action: () => {},
    },
    {
      id: '3',
      icon: 'bug',
      title: 'Report Bug',
      subtitle: 'Found an issue?',
      color: '#EC4899',
      action: () => {},
    },
  ];

  const faqs = [
    {
      id: '1',
      question: 'How do I create a new project?',
      answer: 'Go to your Profile > My Projects and tap the + button. Fill in the project details and tap Create Project.',
    },
    {
      id: '2',
      question: 'Can I join multiple teams?',
      answer: 'Yes! You can join as many teams as you like. Just browse teams and send join requests.',
    },
    {
      id: '3',
      question: 'How do I change my profile picture?',
      answer: 'Go to Profile > Edit Profile and tap on your avatar to upload a new photo.',
    },
    {
      id: '4',
      question: 'Is my data secure?',
      answer: 'Absolutely! We use industry-standard encryption and never share your personal data without consent.',
    },
    {
      id: '5',
      question: 'How do I delete my account?',
      answer: 'Go to Settings > Account > Delete Account. Note that this action is permanent and cannot be undone.',
    },
    {
      id: '6',
      question: 'Can I export my projects?',
      answer: 'Yes! You can export your project portfolio as a PDF from My Projects > Export option.',
    },
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#10B981', '#059669']}
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Banner */}
        <LinearGradient
          colors={['#ECFDF5', '#D1FAE5']}
          style={styles.welcomeBanner}
        >
          <Ionicons name="help-circle" size={40} color="#10B981" />
          <Text style={styles.bannerTitle}>How can we help you?</Text>
          <Text style={styles.bannerSubtitle}>
            Browse FAQs or contact our support team
          </Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.action}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqCard}
              onPress={() => toggleFAQ(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7280"
                />
              </View>
              {expandedFAQ === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Still need help?</Text>
          <Text style={styles.footerText}>
            Our support team is available 24/7
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:support@campuslink.com')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.contactButtonGradient}
            >
              <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  welcomeBanner: {
    margin: getSpacing(20),
    padding: getSpacing(24),
    borderRadius: getBorderRadius(16),
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: isSmallDevice ? getFontSize(18) : getFontSize(20),
    fontWeight: '700',
    color: '#065F46',
    marginTop: getSpacing(12),
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: isSmallDevice ? getFontSize(13) : getFontSize(14),
    color: '#047857',
    marginTop: getSpacing(6),
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: getSpacing(20),
    marginBottom: getSpacing(24),
  },
  sectionTitle: {
    fontSize: isSmallDevice ? getFontSize(16) : getFontSize(18),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: getSpacing(12),
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: getSpacing(12),
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: getBorderRadius(16),
    padding: isSmallDevice ? getSpacing(14) : getSpacing(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: getBorderRadius(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(10),
  },
  actionTitle: {
    fontSize: isSmallDevice ? getFontSize(12) : getFontSize(13),
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: getFontSize(11),
    color: '#9CA3AF',
    marginTop: getSpacing(4),
    textAlign: 'center',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: getBorderRadius(12),
    padding: isSmallDevice ? getSpacing(14) : getSpacing(16),
    marginBottom: getSpacing(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: isSmallDevice ? getFontSize(13) : getFontSize(14),
    fontWeight: '600',
    color: '#1F2937',
    marginRight: getSpacing(10),
  },
  faqAnswer: {
    fontSize: isSmallDevice ? getFontSize(12) : getFontSize(13),
    color: '#6B7280',
    marginTop: getSpacing(10),
    lineHeight: isSmallDevice ? 18 : 20,
  },
  footer: {
    margin: getSpacing(20),
    padding: getSpacing(24),
    backgroundColor: '#FFFFFF',
    borderRadius: getBorderRadius(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  footerTitle: {
    fontSize: isSmallDevice ? getFontSize(16) : getFontSize(18),
    fontWeight: '700',
    color: '#1F2937',
  },
  footerText: {
    fontSize: getFontSize(13),
    color: '#6B7280',
    marginTop: getSpacing(6),
    marginBottom: getSpacing(16),
  },
  contactButton: {
    width: '100%',
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? getSpacing(12) : getSpacing(14),
    borderRadius: getBorderRadius(12),
    gap: getSpacing(8),
  },
  contactButtonText: {
    fontSize: isSmallDevice ? getFontSize(14) : getFontSize(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HelpSupportScreen;
