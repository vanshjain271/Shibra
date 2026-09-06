import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { RootStackScreenProps } from '../../types/navigation.types';
import { blogService, Blog } from '../../services/blog.service';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

const BlogDetailsScreen: React.FC<RootStackScreenProps<'BlogDetails'>> = ({ navigation, route }) => {
  const { blogId } = route.params;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBlog();
  }, [blogId]);

  const loadBlog = async () => {
    const data = await blogService.getBlogById(blogId);
    setBlog(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!blog) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Blog post not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <FastImage
          source={{ uri: blog.image }}
          style={styles.image}
          resizeMode={FastImage.resizeMode.cover}
        />
        
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{blog.category.toUpperCase()}</Text>
            </View>
            <Text style={styles.readTime}>{blog.readTime} read</Text>
          </View>

          <Text style={styles.title}>{blog.title}</Text>
          
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{blog.author.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{blog.author}</Text>
              <Text style={styles.date}>{new Date(blog.publishedAt).toLocaleDateString()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.blogBody}>{blog.content}</Text>
          
          <View style={{ height: SPACING.xxxl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  image: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: SPACING.xl,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  readTime: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 28,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    lineHeight: 36,
    marginBottom: SPACING.xl,
    fontWeight: '800',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 16,
  },
  authorName: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  blogBody: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  errorText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 14,
  },
});

export default BlogDetailsScreen;
