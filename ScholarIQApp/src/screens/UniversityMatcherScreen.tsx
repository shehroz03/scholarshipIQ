import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Button } from '../components/UIComponents';
import { COLORS } from '../constants/theme';
import { scholarshipService } from '../services/api';

export const UniversityMatcherScreen = () => {
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    if (!keyword && !country) return;
    setLoading(true);
    try {
      const data = await scholarshipService.getMatchedUniversities({ 
        keyword: keyword,
        country: country 
      });
      setResults(data);
    } catch (error) {
      console.error('Matching error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>University Matcher</Text>
          <Text style={styles.subtitle}>Find your perfect academic home</Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.label}>Search Keyword</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Computer Science, Oxford"
            placeholderTextColor={COLORS.textSecondary}
            value={keyword}
            onChangeText={setKeyword}
          />
          <Text style={styles.label}>Target Country (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. United Kingdom"
            placeholderTextColor={COLORS.textSecondary}
            value={country}
            onChangeText={setCountry}
          />
          <Button title="Analyze Matches" onPress={handleMatch} loading={loading} />
        </Card>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Analyzing university data...</Text>
          </View>
        ) : results.length > 0 ? (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>Institutional Fits Found ({results.length})</Text>
            {results.map(uni => (
              <Card key={uni.id} style={styles.resultCard}>
                <View style={styles.resHeader}>
                  <Text style={styles.uniName}>{uni.name}</Text>
                  <View style={styles.locBadge}>
                    <Text style={styles.locText}>📍 {uni.city}, {uni.country}</Text>
                  </View>
                </View>
                <Text style={styles.description} numberOfLines={3}>{uni.description || 'Top-tier institution matching your criteria.'}</Text>
                <View style={styles.statsRow}>
                   <Text style={styles.stat}>🎓 {uni.world_ranking ? `#${uni.world_ranking}` : 'Top Rank'}</Text>
                   <Text style={styles.stat}>📊 Min CGPA: {uni.min_cgpa || 'N/A'}</Text>
                </View>
              </Card>
            ))}
          </View>
        ) : results.length === 0 && !loading && keyword ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No universities found for your criteria.</Text>
          </View>
        ) : null}
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
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  formCard: {
    padding: 20,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    color: COLORS.white,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  results: {
    marginTop: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 16,
  },
  resultCard: {
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  resHeader: {
    marginBottom: 10,
  },
  uniName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  locBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  locText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  stat: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  center: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
