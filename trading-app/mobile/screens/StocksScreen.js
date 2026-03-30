import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  FlatList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { stocksAPI } from '../api';

export default function StocksScreen({ navigation }) {
  const [stocks, setStocks] = useState([]);
  const [filterSignal, setFilterSignal] = useState('all');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchStocks();
    }, [])
  );

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await stocksAPI.getAll();
      setStocks(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(stock => {
    if (filterSignal === 'all') return true;
    return stock.lastSignal?.signal === filterSignal;
  });

  const getSignalColor = (signal) => {
    if (signal === 'ACHAT') return '#10B981';
    if (signal === 'VENTE') return '#EF4444';
    return '#6B7280';
  };

  const getSignalIcon = (signal) => {
    if (signal === 'ACHAT') return '📈';
    if (signal === 'VENTE') return '📉';
    return '➡️';
  };

  const renderStock = ({ item }) => (
    <TouchableOpacity
      style={styles.stockCard}
      onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
    >
      <View style={styles.stockHeader}>
        <View>
          <Text style={styles.stockSymbol}>{item.symbol}</Text>
          <Text style={styles.stockName} numberOfLines={1}>{item.name}</Text>
        </View>
        {item.sector && (
          <Text style={styles.sector}>{item.sector}</Text>
        )}
      </View>

      {item.lastSignal ? (
        <>
          <View style={styles.signalRow}>
            <View
              style={[
                styles.signalBadge,
                { backgroundColor: getSignalColor(item.lastSignal.signal) }
              ]}
            >
              <Text style={styles.signalIcon}>{getSignalIcon(item.lastSignal.signal)}</Text>
              <Text style={styles.signalBadgeText}>{item.lastSignal.signal}</Text>
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{item.lastSignal.confidence}</Text>
            </View>
          </View>

          <View style={styles.scoresRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreBoxLabel}>Technique</Text>
              <Text style={styles.scoreBoxValue}>{item.lastSignal.technicalScore}%</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreBoxLabel}>Fondamental</Text>
              <Text style={styles.scoreBoxValue}>{item.lastSignal.fundamentalScore}%</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreBoxLabel}>Actualités</Text>
              <Text style={styles.scoreBoxValue}>{item.lastSignal.newsScore}%</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.noSignal}>Aucun signal disponible</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Actions Cotées</Text>
        <Text style={styles.subtitle}>{stocks.length} actions</Text>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'ACHAT', 'NEUTRE', 'VENTE'].map(signal => (
          <TouchableOpacity
            key={signal}
            style={[
              styles.filterButton,
              filterSignal === signal && styles.filterButtonActive
            ]}
            onPress={() => setFilterSignal(signal)}
          >
            <Text
              style={[
                styles.filterText,
                filterSignal === signal && styles.filterTextActive
              ]}
            >
              {signal === 'all' ? 'Tous' : signal}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stocks List */}
      <FlatList
        data={filteredStocks}
        renderItem={renderStock}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStocks} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune action trouvée</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827'
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF'
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
    marginRight: 8
  },
  filterButtonActive: {
    backgroundColor: '#2563EB'
  },
  filterText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500'
  },
  filterTextActive: {
    color: '#fff'
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20
  },
  stockCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151'
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  stockName: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    maxWidth: 200
  },
  sector: {
    fontSize: 11,
    color: '#9CA3AF',
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  signalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  signalIcon: {
    fontSize: 14,
    marginRight: 4
  },
  signalBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12
  },
  confidenceBadge: {
    backgroundColor: '#EAB30820',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  confidenceText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600'
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center'
  },
  scoreBoxLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2
  },
  scoreBoxValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#60A5FA'
  },
  noSignal: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center'
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16
  }
});
