import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { RootStackScreenProps } from '../../types/navigation.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { apiClient } from '../../services/api.service';

const PolicyViewerScreen: React.FC<RootStackScreenProps<'PolicyViewer'>> = ({ route, navigation }) => {
  const { title, policyKey } = route.params;
  const { width } = useWindowDimensions();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title });
    fetchPolicy();
  }, [title, policyKey]);

  const fetchPolicy = async () => {
    try {
      const response = await apiClient.get('/settings');
      if (response.success && response.data) {
        let rawContent = response.data[policyKey] || '<p>Policy content not available at the moment.</p>';
        rawContent = rawContent.replace(/\n/g, '<br/>');
        setContent(rawContent);
      }
    } catch (error) {
      console.error(`Error fetching policy (${policyKey}):`, error);
      setContent('<p>Failed to load policy content. Please try again later.</p>');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <RenderHTML
        contentWidth={width - SPACING.lg * 2}
        source={{ html: content }}
        tagsStyles={{
          body: styles.htmlBody,
          p: styles.htmlP,
          strong: styles.htmlStrong,
          h1: styles.htmlH,
          h2: styles.htmlH,
          h3: styles.htmlH,
        }}
      />
      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: SPACING.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  htmlBody: {
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 24,
  },
  htmlP: {
    marginBottom: SPACING.md,
  },
  htmlStrong: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  htmlH: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
});

export default PolicyViewerScreen;
