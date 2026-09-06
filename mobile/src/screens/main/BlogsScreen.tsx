import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackScreenProps } from '../../types/navigation.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { apiClient } from '../../services/api.service';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  publishedAt: string;
}

const BlogsScreen: React.FC<RootStackScreenProps<'Blogs'>> = ({ navigation }) => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await apiClient.get('/blogs');
      if (response.success) {
        setBlogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBlogs();
  };

  const renderBlog = ({ item }: { item: BlogPost }) => (
    <TouchableOpacity
      style={styles.blogCard}
      onPress={() => navigation.navigate('BlogDetails', { blogId: item.slug })}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.coverImage || 'https://via.placeholder.com/400x200' }}
        style={styles.coverImage}
      />
      <View style={styles.blogInfo}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category || 'General'}</Text>
        </View>
        <Text style={styles.blogTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.excerpt} numberOfLines={3}>
          {item.excerpt}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.date}>
            {new Date(item.publishedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          <View style={styles.readMore}>
            <Text style={styles.readMoreText}>Read More</Text>
            <Icon name="arrow-right" size={16} color={COLORS.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={blogs}
        renderItem={renderBlog}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="newspaper-variant-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No blog posts found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  blogCard: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.radius.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surfaceAlt,
  },
  blogInfo: {
    padding: SPACING.md,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textTransform: 'uppercase',
  },
  blogTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  excerpt: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  date: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});

export default BlogsScreen;
