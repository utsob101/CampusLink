import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const API_URL_KEY = 'campuslink_api_url';

export default function ApiConfigScreen({ navigation }) {
  const [apiUrl, setApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadSavedApiUrl();
  }, []);

  const loadSavedApiUrl = async () => {
    try {
      const saved = await AsyncStorage.getItem(API_URL_KEY);
      if (saved) {
        setApiUrl(saved);
      }
    } catch (error) {
      console.error('Error loading saved API URL:', error);
    }
  };

  const testConnection = async (url) => {
    try {
      setIsLoading(true);
      setTestResult(null);

      const testUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      const response = await fetch(`${testUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({ success: true, message: 'Connection successful!' });
        return true;
      } else {
        setTestResult({ success: false, message: `Server returned ${response.status}` });
        return false;
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Connection failed: ${error.message}` 
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter an API URL');
      return;
    }

    await testConnection(apiUrl);
  };

  const handleSave = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter an API URL');
      return;
    }

    const isValid = await testConnection(apiUrl);
    
    if (isValid) {
      try {
        await AsyncStorage.setItem(API_URL_KEY, apiUrl);
        Alert.alert(
          'Success',
          'API URL saved! Please restart the app for changes to take effect.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to save API URL');
      }
    } else {
      Alert.alert(
        'Connection Failed',
        'The API URL could not be reached. Do you still want to save it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save Anyway',
            onPress: async () => {
              await AsyncStorage.setItem(API_URL_KEY, apiUrl);
              navigation.goBack();
            },
          },
        ]
      );
    }
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear API URL',
      'This will reset to the default configuration. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(API_URL_KEY);
            setApiUrl('');
            setTestResult(null);
            Alert.alert('Success', 'API URL cleared. Restart the app to use default configuration.');
          },
        },
      ]
    );
  };

  const suggestedUrls = [
    { label: 'Local (Android Emulator)', url: 'http://10.0.2.2:4000' },
    { label: 'Local (iOS Simulator)', url: 'http://localhost:4000' },
    { label: 'Custom LAN IP', url: 'http://192.168.0.100:4000' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>API Configuration</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Configure the backend server URL. This is useful when connecting to a backend on a different network.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Backend API URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://192.168.0.100:4000"
            placeholderTextColor={COLORS.text.secondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={Platform.OS === 'ios' ? 'url' : 'default'}
          />
          <Text style={styles.hint}>
            Enter the full URL including http:// and port number
          </Text>
        </View>

        {testResult && (
          <View
            style={[
              styles.resultBox,
              testResult.success ? styles.resultSuccess : styles.resultError,
            ]}
          >
            <Ionicons
              name={testResult.success ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={testResult.success ? COLORS.success : COLORS.error}
            />
            <Text
              style={[
                styles.resultText,
                testResult.success ? styles.resultTextSuccess : styles.resultTextError,
              ]}
            >
              {testResult.message}
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleTest}
            disabled={isLoading}
          >
            <Text style={styles.buttonSecondaryText}>
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.buttonPrimaryText}>Save</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Clear & Use Default</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested URLs</Text>
          {suggestedUrls.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => setApiUrl(item.url)}
            >
              <View>
                <Text style={styles.suggestionLabel}>{item.label}</Text>
                <Text style={styles.suggestionUrl}>{item.url}</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              Start your backend server and note the IP address shown in console
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              Enter the URL here (e.g., http://192.168.0.100:4000)
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>
              Test the connection to verify it works
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>4</Text>
            <Text style={styles.instructionText}>
              Save and restart the app
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  content: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  hint: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultSuccess: {
    backgroundColor: COLORS.success + '15',
  },
  resultError: {
    backgroundColor: COLORS.error + '15',
  },
  resultText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  resultTextSuccess: {
    color: COLORS.success,
  },
  resultTextError: {
    color: COLORS.error,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
    marginBottom: 24,
  },
  clearButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  suggestionUrl: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
});
