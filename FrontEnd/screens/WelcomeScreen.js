import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { 
  scale, 
  verticalScale, 
  moderateScale, 
  getFontSize, 
  getSpacing, 
  getBorderRadius,
  getButtonHeight,
  isSmallDevice 
} from '../utils/responsive';

export default function WelcomeScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();

  // If user is authenticated and lands on Welcome, redirect to Feed
  useEffect(() => {
    if (user) {
      navigation.replace('Feed');
    }
  }, [user, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Pure Rich Purple Background */}
      <View style={styles.background}>
        <View style={styles.purpleBase} />
        <View style={styles.purpleLayer1} />
        <View style={styles.purpleLayer2} />
        <View style={styles.purpleShape1} />
        <View style={styles.purpleShape2} />
        <View style={styles.purpleShape3} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoRing} />
              <View style={styles.logo}>
                <Text style={styles.logoIcon}>🎓</Text>
              </View>
            </View>
            
            <Text style={styles.title}>
              <Text style={styles.titleGradient}>Campus</Text>
              <Text style={styles.titleAccent}>Link</Text>
            </Text>
            <Text style={styles.subtitle}>
              Where students connect and collaborate
            </Text>
          </View>

          {/* Value Props - Clean Cards */}
          <View style={styles.valueSection}>
            <View style={styles.valueCard}>
              <View style={styles.valueIcon}>
                <View style={styles.iconBg1}>
                  <View style={styles.usersIcon}>
                    <View style={styles.userDot1} />
                    <View style={styles.userDot2} />
                  </View>
                </View>
              </View>
              <View style={styles.valueContent}>
                <Text style={styles.valueTitle}>Connect with Students</Text>
                <Text style={styles.valueDesc} numberOfLines={1}>Meet peers in your university</Text>
              </View>
            </View>

            <View style={styles.valueCard}>
              <View style={styles.valueIcon}>
                <View style={styles.iconBg2}>
                  <View style={styles.rocketIcon}>
                    <View style={styles.rocketBody} />
                    <View style={styles.rocketWindow} />
                    <View style={styles.rocketFin} />
                  </View>
                </View>
              </View>
              <View style={styles.valueContent}>
                <Text style={styles.valueTitle}>Find Teammates</Text>
                <Text style={styles.valueDesc} numberOfLines={1}>Build your project team</Text>
              </View>
            </View>

            <View style={styles.valueCard}>
              <View style={styles.valueIcon}>
                <View style={styles.iconBg3}>
                  <View style={styles.bulbIcon}>
                    <View style={styles.bulbTop} />
                    <View style={styles.bulbBase} />
                    <View style={styles.sparkle} />
                  </View>
                </View>
              </View>
              <View style={styles.valueContent}>
                <Text style={styles.valueTitle}>Collaborate on Projects</Text>
                <Text style={styles.valueDesc} numberOfLines={1}>Work together and create</Text>
              </View>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  // Light Purple Layers
  purpleBase: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F3FF',
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
  // Light Purple Shapes (dynamic - will update with screen dimensions)
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
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: getSpacing(28),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + verticalScale(50) : verticalScale(60),
    paddingBottom: verticalScale(40),
    justifyContent: 'space-between',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: verticalScale(28),
  },
  logoRing: {
    position: 'absolute',
    width: moderateScale(106),
    height: moderateScale(106),
    borderRadius: moderateScale(53),
    borderWidth: 2,
    borderColor: '#6C63FF',
    opacity: 0.15,
    top: -3,
    left: -3,
  },
  logo: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoIcon: {
    fontSize: getFontSize(48),
  },
  title: {
    fontSize: getFontSize(isSmallDevice ? 36 : 40),
    fontWeight: '800',
    marginBottom: verticalScale(10),
    letterSpacing: -1.5,
    flexDirection: 'row',
  },
  titleGradient: {
    fontSize: getFontSize(isSmallDevice ? 36 : 40),
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -1.5,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  titleAccent: {
    fontSize: getFontSize(isSmallDevice ? 36 : 40),
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -1.5,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  subtitle: {
    fontSize: getFontSize(16),
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  
  // Value Props
  valueSection: {
    gap: getSpacing(16),
    marginBottom: verticalScale(40),
  },
  valueCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: getSpacing(20),
    borderRadius: getBorderRadius(18),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  valueIcon: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: getBorderRadius(14),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing(16),
  },
  
  // Custom Icons
  iconBg1: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg2: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg3: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Users Icon
  usersIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  userDot1: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    top: 4,
    left: 2,
  },
  userDot2: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    top: 4,
    right: 2,
  },
  
  // Rocket Icon
  rocketIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  rocketBody: {
    position: 'absolute',
    width: 10,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    top: 0,
    left: 5,
  },
  rocketWindow: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
    top: 4,
    left: 8,
  },
  rocketFin: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    bottom: 0,
    left: 7,
    transform: [{ rotate: '45deg' }],
  },
  
  // Bulb Icon
  bulbIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  bulbTop: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    top: 2,
    left: 4,
  },
  bulbBase: {
    position: 'absolute',
    width: 8,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    bottom: 2,
    left: 6,
  },
  sparkle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    top: 0,
    right: 2,
  },
  
  valueEmoji: {
    fontSize: 26,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: getFontSize(17),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: verticalScale(3),
    letterSpacing: -0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  valueDesc: {
    fontSize: getFontSize(14),
    fontWeight: '400',
    color: '#666666',
    letterSpacing: 0,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  
  // CTA
  ctaSection: {
    gap: getSpacing(12),
    paddingBottom: verticalScale(10),
  },
  primaryBtn: {
    backgroundColor: '#6C63FF',
    paddingVertical: getButtonHeight(18),
    borderRadius: getBorderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: getButtonHeight(52),
  },
  primaryBtnText: {
    fontSize: getFontSize(17),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
  secondaryBtn: {
    backgroundColor: '#F8F9FA',
    paddingVertical: getButtonHeight(18),
    borderRadius: getBorderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    minHeight: getButtonHeight(52),
  },
  secondaryBtnText: {
    fontSize: getFontSize(17),
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    }),
  },
});
