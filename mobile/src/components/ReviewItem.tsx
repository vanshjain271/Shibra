import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Review } from '../types/api.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface ReviewItemProps {
  review: Review;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
  // SAFETY: handle case where user is a string ID instead of populated object
  const getUserName = (): string => {
    if (!review.user) return 'Anonymous';
    if (typeof review.user === 'string') return 'User';
    return review.user.name || 'User';
  };

  const getInitial = (): string => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            style={[
              styles.star,
              { color: star <= rating ? COLORS.warning : COLORS.border },
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial()}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{getUserName()}</Text>
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>
        {renderStars(review.rating)}
      </View>
      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
      ) : null}
      {review.isVerified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Verified Purchase</Text>
        </View>
      )}
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 14,
  },
  userName: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 14,
    marginLeft: 2,
  },
  comment: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: SPACING.sm,
  },
});

export default ReviewItem;
