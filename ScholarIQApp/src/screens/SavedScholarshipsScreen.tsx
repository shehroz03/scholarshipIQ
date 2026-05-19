import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { COLORS } from '../constants/theme';
import { scholarshipService } from '../services/api';

export const SavedScholarshipsScreen = ({ navigation }: any) => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const data = await scholarshipService.getSavedScholarships();
      setSaved(data);
    } catch (error) {
      console.error('Error fetching saved scholarships:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={saved}
          renderItem={({ item }) => (
            <ScholarshipCard 
              scholarship={item} 
              onPress={() => navigation.navigate('ScholarshipDetail', { id: item.id })} 
            />
          )}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No saved scholarships yet.</Text>
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
  listContent: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
