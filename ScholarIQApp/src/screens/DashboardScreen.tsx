import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card } from '../components/UIComponents';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { COLORS } from '../constants/theme';
import { userService, scholarshipService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [sumData, recData] = await Promise.all([
        userService.getDashboardSummary(),
        scholarshipService.getRecommendations()
      ]);
      setSummary(sumData);
      setRecommendations(recData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcome}>WELCOME BACK,</Text>
          <Text style={styles.name}>{user?.full_name?.toUpperCase() || 'SCHOLAR'}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{summary?.total_applications || 0}</Text>
            <Text style={styles.statLabel}>APPLICATIONS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{summary?.saved_count || 0}</Text>
            <Text style={styles.statLabel}>SAVED</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{summary?.profile_completion || 0}%</Text>
            <Text style={styles.statLabel}>PROFILE</Text>
          </View>
        </View>

        <Card style={styles.aiCard} onPress={() => navigation.navigate('Consultant')}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiEmoji}>🤖</Text>
            <View>
              <Text style={styles.aiTitle}>AI Consultant</Text>
              <Text style={styles.aiSubtitle}>Ask anything about your future</Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Recommendations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recommendations.slice(0, 3).map((item: any) => (
          <ScholarshipCard 
            key={item.id} 
            scholarship={item} 
            onPress={() => navigation.navigate('ScholarshipDetail', { id: item.id })} 
          />
        ))}

        {recommendations.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Updating your matches...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  welcome: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  name: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  aiCard: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '40',
    padding: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  aiTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  aiSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  seeAll: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
