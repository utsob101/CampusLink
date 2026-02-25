import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { api } from '../lib/api';

/**
 * Request camera and media library permissions
 */
export const requestPermissions = async () => {
  const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
  const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
    Alert.alert('Permission Required', 'Please grant camera and media library permissions to upload profile pictures.');
    return false;
  }
  return true;
};

/**
 * Pick image from library
 */
export const pickImageFromLibrary = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
    return null;
  }
};

/**
 * Take photo with camera
 */
export const takePhoto = async () => {
  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
    return null;
  }
};

/**
 * Upload image to Supabase Storage
 */
export const uploadAvatarToSupabase = async (uri, userId) => {
  try {
    // Upload via backend
    const { url } = await api.uploadImage(uri);
    return { publicUrl: url, error: null };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { publicUrl: null, error };
  }
};

/**
 * Update profile with new avatar URL
 */
export const updateProfileAvatar = async (userId, avatarUrl) => {
  try {
    await api.updateMe({ avatar_url: avatarUrl });
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating profile avatar:', error);
    return { success: false, error };
  }
};

/**
 * Remove profile avatar (deletes file from server and resets to default)
 */
export const removeProfileAvatar = async () => {
  try {
    const result = await api.removeAvatar();
    return { success: true, user: result.user, error: null };
  } catch (error) {
    console.error('Error removing profile avatar:', error);
    return { success: false, error };
  }
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }
  return names[0][0].toUpperCase();
};

/**
 * Generate beautiful realistic avatar URL using UI Avatars API
 * Creates professional headshot-style avatars with names
 * @param {string} name - User's name
 * @returns {string} Avatar image URL
 */
export const generateAvatarUrl = (name) => {
  if (!name) name = 'User';
  
  // Detect gender for appropriate styling
  const detectedGender = detectGenderFromName(name);
  
  // Get gradient colors based on name
  const gradient = detectedGender === 'female' 
    ? getGradientByGender(name, 'female')
    : detectedGender === 'male'
    ? getGradientByGender(name, 'male')
    : getGradientFromName(name);
  
  // Convert hex to RGB for background
  const bgColor = gradient[0].replace('#', '');
  const textColor = 'ffffff';
  
  // Get initials
  const initials = getInitials(name);
  
  // UI Avatars API - creates beautiful, professional avatars
  // Format: name, size, background color, text color, bold, rounded
  const encodedName = encodeURIComponent(initials);
  
  return `https://ui-avatars.com/api/?name=${encodedName}&size=200&background=${bgColor}&color=${textColor}&bold=true&rounded=true&format=svg&font-size=0.4`;
};

/**
 * Get avatar URL or initials for rendering
 * Returns object with type and value
 */
export const getAvatarDisplay = (name, avatarUrl = null) => {
  if (avatarUrl) {
    return {
      type: 'image',
      value: avatarUrl,
    };
  }
  
  // Return generated avatar URL
  return {
    type: 'generated',
    value: generateAvatarUrl(name),
  };
};

/**
 * Beautiful gradient collections for avatars
 */
const GRADIENTS = {
  // Professional & Elegant Gradients
  twilight: ['#4A00E0', '#8E2DE2'],        // Deep Purple
  sunset: ['#FF6B6B', '#FFE66D'],          // Red to Yellow
  ocean: ['#2E3192', '#1BFFFF'],           // Deep Blue to Cyan
  forest: ['#134E5E', '#71B280'],          // Deep Green to Light Green
  lavender: ['#A8EDEA', '#FED6E3'],        // Mint to Pink
  peach: ['#FF9A9E', '#FECFEF'],           // Peach to Pink
  blueberry: ['#667EEA', '#764BA2'],       // Blue to Purple
  mint: ['#00F260', '#0575E6'],            // Mint to Blue
  sunrise: ['#FA709A', '#FEE140'],         // Pink to Yellow
  cosmic: ['#8E2DE2', '#4A00E0'],          // Purple Gradient
  
  // Vibrant & Modern Gradients
  candy: ['#FC466B', '#3F5EFB'],           // Pink to Blue
  aurora: ['#00C9FF', '#92FE9D'],          // Cyan to Green
  fire: ['#F83600', '#FE8C00'],            // Orange Fire
  ice: ['#00D2FF', '#3A7BD5'],             // Ice Blue
  rose: ['#ED4264', '#FFEDBC'],            // Rose to Cream
  emerald: ['#56AB2F', '#A8E063'],         // Green Gradient
  royal: ['#141E30', '#243B55'],           // Dark Blue
  cherry: ['#EB3349', '#F45C43'],          // Red Cherry
  sky: ['#1E3C72', '#2A5298'],             // Sky Blue
  coral: ['#FF6B6B', '#FFE66D'],           // Coral
  
  // Soft & Professional Gradients
  sage: ['#56CCF2', '#2F80ED'],            // Soft Blue
  honey: ['#FDC830', '#F37335'],           // Yellow to Orange
  grape: ['#DA22FF', '#9733EE'],           // Purple Grape
  watermelon: ['#FF4B2B', '#FF416C'],      // Red Watermelon
  citrus: ['#FBD786', '#F7797D'],          // Yellow to Coral
  aqua: ['#36D1DC', '#5B86E5'],            // Aqua Blue
  berry: ['#E94057', '#F27121'],           // Berry Red
  meadow: ['#4CB8C4', '#3CD3AD'],          // Green Meadow
  dusk: ['#667DB6', '#0082C8'],            // Evening Sky
  blossom: ['#F857A6', '#FF5858'],         // Pink Blossom
};

const GRADIENT_KEYS = Object.keys(GRADIENTS);

/**
 * Generate gradient colors based on name (consistent per user)
 */
export const getGradientFromName = (name) => {
  if (!name) {
    // Default gradient for users without names
    return GRADIENTS.twilight;
  }
  
  // Generate a consistent index based on the name
  const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const index = charCodeSum % GRADIENT_KEYS.length;
  const gradientKey = GRADIENT_KEYS[index];
  
  return GRADIENTS[gradientKey];
};

/**
 * Get gradient based on gender (if known) for more personalized defaults
 */
export const getGradientByGender = (name, gender) => {
  // If gender is specified, use gender-appropriate gradients
  if (gender === 'female') {
    const femaleGradients = ['lavender', 'peach', 'rose', 'blossom', 'candy', 'sunset', 'watermelon', 'cherry', 'coral'];
    const charCodeSum = name ? name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) : 0;
    const index = charCodeSum % femaleGradients.length;
    return GRADIENTS[femaleGradients[index]];
  } else if (gender === 'male') {
    const maleGradients = ['twilight', 'ocean', 'forest', 'cosmic', 'royal', 'sky', 'sage', 'dusk', 'ice', 'emerald'];
    const charCodeSum = name ? name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) : 0;
    const index = charCodeSum % maleGradients.length;
    return GRADIENTS[maleGradients[index]];
  }
  
  // Default: use name-based gradient
  return getGradientFromName(name);
};

/**
 * Detect possible gender from name (basic heuristic - not always accurate)
 */
export const detectGenderFromName = (name) => {
  if (!name) return null;
  
  const lowerName = name.toLowerCase().trim();
  
  // Common female name endings
  const femaleEndings = ['a', 'e', 'i', 'ie', 'y', 'ine', 'een', 'elle', 'ette', 'anna', 'ita'];
  // Common male name endings  
  const maleEndings = ['n', 'd', 'k', 'r', 's', 'l', 'an', 'on', 'er', 'son'];
  
  // Common female names (Bangladeshi + international)
  const femaleNames = ['sarah', 'maria', 'jessica', 'jennifer', 'michelle', 'emily', 'amanda', 'lisa', 'mary', 'fatima', 'aisha', 'zainab', 'maryam', 'khadija', 'nusrat', 'sadia', 'tasneem', 'farzana', 'hania', 'amir', 'dure', 'fishan', 'yumna', 'zaidi', 'sana', 'ayesha', 'anam', 'bushra', 'samira', 'farida', 'rahima', 'nafisa', 'shirin', 'yasmin', 'farhana', 'sabrina', 'jannatul', 'ferdous', 'mim', 'ummay', 'habiba', 'ruqayya', 'haque', 'sumya', 'akter', 'maysha', 'nishi', 'zahan', 'nabila', 'mimfa', 'ornid', 'mini', 'mithi', 'aiza', 'noor', 'syeda', 'adiba', 'noshin', 'halima', 'mst', 'jabin', 'sara', 'sultana', 'farzia', 'tasnim', 'sinthia', 'urmi', 'jebunnesa', 'zamal', 'raisha', 'zaman'];
  // Common male names (Bangladeshi + international)
  const maleNames = ['john', 'michael', 'david', 'james', 'robert', 'william', 'richard', 'ahmed', 'muhammad', 'ali', 'omar', 'ibrahim', 'yusuf', 'hassan', 'abdullah', 'khalid', 'utsob', 'utsho', 'soykot', 'ahamed', 'sultan', 'ahmmed', 'shadhin', 'faruk', 'fahim', 'rakibul', 'samiul', 'riajul', 'sadat', 'aslam', 'kazi', 'sazzad', 'hasib', 'himu', 'minhajur', 'redwan', 'jobayer', 'hossan', 'raduan', 'ishrak', 'tarikul', 'adnan', 'sami', 'maheen', 'tanjim', 'mahi', 'tahsin', 'mahtab', 'tahmid', 'masud', 'mohaimin', 'kymar', 'mondol', 'shishir', 'nishat', 'nazmus', 'sakib', 'reza', 'rafi', 'raihan', 'yasir', 'rahat', 'ashiqur', 'akbar', 'rakib', 'arman', 'monindra', 'roy', 'sagor', 'zafor', 'saadik', 'sahid', 'naimur', 'sayeb', 'senam', 'mahin', 'sheikh', 'shojib', 'mamun', 'shikdar', 'merja', 'shourov', 'shahadat', 'shuhan', 'shariar', 'soton', 'sudipto', 'mandol', 'tanbin', 'tazim'];
  
  const firstName = lowerName.split(' ')[0];
  
  // Check against known names first
  if (femaleNames.some(n => firstName.includes(n))) return 'female';
  if (maleNames.some(n => firstName.includes(n))) return 'male';
  
  // Check endings
  const lastTwoChars = firstName.slice(-2);
  const lastThreeChars = firstName.slice(-3);
  
  if (femaleEndings.some(ending => firstName.endsWith(ending))) {
    return 'female';
  }
  
  return null; // Unknown
};

