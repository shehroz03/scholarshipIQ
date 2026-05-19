import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { COLORS } from '../constants/theme';
import { scholarshipService } from '../services/api';

export const SearchScreen = ({ navigation }: any) => {
  const [scholarships, setScholarships] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchScholarships = async (searchQuery = '') => {
    setLoading(true);
    try {
      const data = await scholarshipService.getScholarships({ q: searchQuery });
      setScholarships(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarships();
  }, []);

  const handleSearch = () => {
    fetchScholarships(query);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.input}
            placeholder="Search scholarships, countries..."
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchIcon}>
            <Text>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={scholarships}
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
              <Text style={styles.emptyText}>No scholarships found.</Text>
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
    padding: 20,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.white,
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 12,
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
