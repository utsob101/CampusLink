import { Dimensions, PixelRatio } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard Android device (e.g., Pixel 4)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scales a value based on screen width
 * @param {number} size - The size to scale
 * @returns {number} - Scaled size
 */
export const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scales a value based on screen height
 * @param {number} size - The size to scale
 * @returns {number} - Scaled size
 */
export const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderately scales a value (mix of width and height)
 * @param {number} size - The size to scale
 * @param {number} factor - Scaling factor (default: 0.5)
 * @returns {number} - Scaled size
 */
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Moderately scales vertically
 * @param {number} size - The size to scale
 * @param {number} factor - Scaling factor (default: 0.5)
 * @returns {number} - Scaled size
 */
export const moderateVerticalScale = (size, factor = 0.5) => size + (verticalScale(size) - size) * factor;

/**
 * Returns true if device is small (width < 360)
 */
export const isSmallDevice = SCREEN_WIDTH < 360;

/**
 * Returns true if device is medium (360 <= width < 400)
 */
export const isMediumDevice = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 400;

/**
 * Returns true if device is large (width >= 400)
 */
export const isLargeDevice = SCREEN_WIDTH >= 400;

/**
 * Returns true if device is extra large (width >= 500, like tablets)
 */
export const isTablet = SCREEN_WIDTH >= 500;

/**
 * Get responsive font size
 * @param {number} size - Base font size
 * @returns {number} - Responsive font size
 */
export const getFontSize = (size) => {
  const newSize = scale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Get responsive spacing
 * @param {number} size - Base spacing size
 * @returns {number} - Responsive spacing
 */
export const getSpacing = (size) => {
  return moderateScale(size, 0.3);
};

/**
 * Get responsive icon size
 * @param {number} size - Base icon size
 * @returns {number} - Responsive icon size
 */
export const getIconSize = (size) => {
  return moderateScale(size, 0.4);
};

/**
 * Get responsive button height
 * @param {number} size - Base button height
 * @returns {number} - Responsive button height
 */
export const getButtonHeight = (size = 52) => {
  return moderateVerticalScale(size, 0.3);
};

/**
 * Get responsive border radius
 * @param {number} size - Base border radius
 * @returns {number} - Responsive border radius
 */
export const getBorderRadius = (size) => {
  return moderateScale(size, 0.2);
};

/**
 * Screen dimension getters (use these instead of direct Dimensions.get())
 */
export const getScreenWidth = () => SCREEN_WIDTH;
export const getScreenHeight = () => SCREEN_HEIGHT;

/**
 * Get percentage width
 * @param {number} percentage - Percentage (0-100)
 * @returns {number} - Width in pixels
 */
export const wp = (percentage) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

/**
 * Get percentage height
 * @param {number} percentage - Percentage (0-100)
 * @returns {number} - Height in pixels
 */
export const hp = (percentage) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

export default {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  getFontSize,
  getSpacing,
  getIconSize,
  getButtonHeight,
  getBorderRadius,
  getScreenWidth,
  getScreenHeight,
  wp,
  hp,
};

