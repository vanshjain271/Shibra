import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { couponService } from '../../services/coupon.service';
import { Coupon } from '../../types/api.types';

interface CouponModalProps {
  visible: boolean;
  onClose: () => void;
  cartTotal: number;
  onApplyCoupon: (code: string) => Promise<boolean>;
  appliedCouponCode?: string;
}

const CouponModal: React.FC<CouponModalProps> = ({
  visible,
  onClose,
  cartTotal,
  onApplyCoupon,
  appliedCouponCode,
}) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [customCode, setCustomCode] = useState('');
  const [applyingCode, setApplyingCode] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadCoupons();
    }
  }, [visible]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const activeCoupons = await couponService.getActiveCoupons();
      setCoupons(activeCoupons);
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (code: string) => {
    if (!code.trim()) return;
    setApplyingCode(code);
    try {
      const success = await onApplyCoupon(code.trim());
      if (success) {
        onClose();
        setCustomCode('');
      }
    } catch (error) {
      // Error is handled by parent usually
    } finally {
      setApplyingCode(null);
    }
  };

  const renderCouponItem = ({ item }: { item: Coupon }) => {
    const isApplicable = cartTotal >= item.minOrderAmount;
    const isApplied = appliedCouponCode === item.code;
    const isApplyingThis = applyingCode === item.code;

    return (
      <View style={[styles.couponCard, isApplied && styles.couponCardApplied, !isApplicable && styles.couponCardDisabled]}>
        <View style={styles.couponHeader}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{item.code}</Text>
          </View>
          {isApplied ? (
            <View style={styles.appliedBadge}>
              <Icon name="check-circle" size={16} color={COLORS.primary} />
              <Text style={styles.appliedText}>APPLIED</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.applyButton, !isApplicable && styles.applyButtonDisabled]}
              onPress={() => handleApply(item.code)}
              disabled={!isApplicable || isApplyingThis || applyingCode !== null}
            >
              {isApplyingThis ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.applyButtonText}>APPLY</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.couponDesc}>{item.description}</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.requirementsRow}>
          <Icon name="information-outline" size={16} color={isApplicable ? COLORS.success : COLORS.error} />
          <Text style={[styles.requirementText, !isApplicable && styles.requirementTextError]}>
            {isApplicable 
              ? `Save on this order!` 
              : `Add items worth ₹${(item.minOrderAmount - cartTotal).toLocaleString('en-IN')} more to get ${item.type === 'PERCENTAGE' ? item.value + '%' : '₹' + item.value} OFF`}
          </Text>
        </View>
        
        <Text style={styles.minOrderHint}>
          Minimum order value: ₹{item.minOrderAmount.toLocaleString('en-IN')}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Offers & Coupons</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Custom Input */}
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter custom coupon code"
                placeholderTextColor={COLORS.textSecondary}
                value={customCode}
                onChangeText={setCustomCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.applyCustomBtn, !customCode.trim() && styles.applyCustomBtnDisabled]}
                onPress={() => handleApply(customCode)}
                disabled={!customCode.trim() || applyingCode !== null}
              >
                {applyingCode === customCode && customCode.trim() ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.applyCustomBtnText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading available offers...</Text>
              </View>
            ) : coupons.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="ticket-percent-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No offers available right now.</Text>
              </View>
            ) : (
              <FlatList
                data={coupons}
                keyExtractor={(item) => item._id}
                renderItem={renderCouponItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  customInputContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
  },
  applyCustomBtn: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    height: 48,
  },
  applyCustomBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  applyCustomBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
  },
  listContainer: {
    padding: SPACING.lg,
  },
  couponCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  couponCardDisabled: {
    opacity: 0.7,
  },
  couponCardApplied: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  codeBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: 'monospace',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 6,
  },
  applyButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  applyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  couponDesc: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    borderStyle: 'dashed',
    marginVertical: SPACING.sm,
  },
  requirementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.success,
    marginLeft: 6,
    fontWeight: '500',
  },
  requirementTextError: {
    color: COLORS.error,
  },
  minOrderHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginLeft: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});

export default CouponModal;
