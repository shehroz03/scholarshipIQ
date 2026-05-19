import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './UIComponents';
import { COLORS } from '../constants/theme';

interface Scholarship {
  id: number;
  title: string;
  university_name?: string;
  country: string;
  funding_type: string;
  deadline?: string;
  grant_amount?: string;
  fit_score?: number;
}

export const ScholarshipCard: React.FC<{ scholarship: Scholarship; onPress: () => void }> = ({ scholarship, onPress }) => {
  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{scholarship.funding_type.toUpperCase()}</Text>
        </View>
        {scholarship.fit_score && (
          <Text style={styles.matchText}>{scholarship.fit_score}% Match</Text>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{scholarship.title}</Text>
      <Text style={styles.uni}>{scholarship.university_name || 'Verified Partner'}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>📍</Text>
          <Text style={styles.statText}>{scholarship.country}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={styles.statText}>{scholarship.grant_amount || 'Full Funding'}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>📅</Text>
          <Text style={styles.statText}>
            {scholarship.deadline ? new Date(scholarship.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Open'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  matchText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 24,
    marginBottom: 4,
  },
  uni: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
});
