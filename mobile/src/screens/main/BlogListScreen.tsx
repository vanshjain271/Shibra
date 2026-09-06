import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation.types';
import { blogService, Blog } from '../../services/blog.service';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Card from '../../components/ui/Card';

type BlogListNavProp = NativeStackNavigationProp<RootStackParamList, 'Blogs'>;

interface BlogListScreenProps {
  navigation: BlogListNavProp;
}

const BlogListScreen: React.FC<BlogListScreenProps> = ({ navigation }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setIsLoading(true);
    const data = await blogService.getBlogs();
    setBlogs(data);
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await blogService.getBlogs();
    setBlogs(data);
    setRefreshing(false);
  };

  const renderBlogItem = ({ item }: { item: Blog }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('BlogDetails', { blogId: item._id })}
    >
      <Card style={styles.blogCard} padding="none">
        <FastImage
          source={{ uri: item.image }}
          style={styles.blogImage}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={styles.blogContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
          </View>
          <Text style={styles.blogTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.blogExcerpt} numberOfLines={3}>
            {item.excerpt}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.footerText}>{item.author} • {item.readTime} read</Text>
            <Text style={styles.footerText}>
              {new Date(item.publishedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shibra Blogs</Text>
        <Text style={styles.headerSubtitle}>Latest Business Insights & News</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={blogs}
          renderItem={renderBlogItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No blogs available at the moment.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACING.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  listContent: {
    padding: SPACING.lg,
  },
  blogCard: {
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  blogImage: {
    width: '100%',
    height: 180,
  },
  blogContent: {
    padding: SPACING.lg,
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  blogTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  blogExcerpt: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});

export default BlogListScreen;
