import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { signalsAPI, stocksAPI } from '../api';

export default function DashboardScreen({ navigation }) {
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState({
    bullish: 0,
    bearish: 0,
    neutral: 0,
    avgScore: 0
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchSignals();
    }, [])
  );

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const response = await signalsAPI.getAll();
      const data = response.data;

      setSignals(data);

      const bullCount = data.filter(s => s.signal === 'ACHAT').length;
      const bearCount = data.filter(s => s.signal === 'VENTE').length;
      const neutCount = data.filter(s => s.signal === 'NEUTRE').length;
      const avgScore = Math.round(
        data.reduce((sum, s) => sum + s.score, 0) / Math.max(data.length, 1)
      );

      setStats({ bullish: bullCount, bearish: bearCount, neutral: neutCount, avgScore });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSignals} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tableau de Bord</Text>
          <Text style={styles.subtitle}>Vue d'ensemble des signaux</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📈</Text>
            <Text style={styles.statValue}>{stats.bullish}</Text>
            <Text style={styles.statLabel}>ACHAT</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📉</Text>
            <Text style={styles.statValue}>{stats.bearish}</Text>
            <Text style={styles.statLabel}>VENTE</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>➡️</Text>
            <Text style={styles.statValue}>{stats.neutral}</Text>
            <Text style={styles.statLabel}>NEUTRE</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statValue}>{stats.avgScore}</Text>
            <Text style={styles.statLabel}>Score Moy.</Text>
          </View>
        </View>

        {/* Signals List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Tous les Signaux</Text>

          {signals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun signal disponible</Text>
            </View>
          ) : (
            signals.map((signal) => (
              <TouchableOpacity
                key={signal.id}
                style={styles.signalCard}
                onPress={() => navigation.navigate('StockDetail', { symbol: signal.symbol })}
              >
                <View style={styles.signalHeader}>
                  <View>
                    <Text style={styles.signalSymbol}>{signal.symbol}</Text>
                    <Text style={styles.signalName}>{signal.name}</Text>
                  </View>
                  <View
                    style={[
                      styles.signalBadge,
                      { backgroundColor: getSignalColor(signal.signal) }
                    ]}
                  >
                    <Text style={styles.signalIcon}>{getSignalIcon(signal.signal)}</Text>
                    <Text style={styles.signalText}>{signal.signal}</Text>
                  </View>
                </View>

                <View style={styles.signalScores}>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>Technique</Text>
                    <Text style={styles.scoreValue}>{signal.technicalScore}%</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>Fondamental</Text>
                    <Text style={styles.scoreValue}>{signal.fundamentalScore}%</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>Actualités</Text>
                    <Text style={styles.scoreValue}>{signal.newsScore}%</Text>
                  </View>
                </View>

                <View style={styles.signalFooter}>
                  <Text style={styles.confidence}>
                    {signal.confidence === 'Forte' ? '⭐⭐⭐' : signal.confidence === 'Moyenne' ? '⭐⭐' : '⭐'}
                  </Text>
                  <Text style={styles.score}>Score: {signal.score}/100</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Pondération</Text>
          <Text style={styles.infoText}>🔵 Technique: 50%</Text>
          <Text style={styles.infoText}>🟣 Fondamental: 30%</Text>
          <Text style={styles.infoText}>🟠 Actualités: 20%</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 24
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 24
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16
  },
  statCardContent: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12
  },
  signalCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151'
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  signalSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  signalName: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4
  },
  signalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  signalIcon: {
    fontSize: 16,
    marginRight: 4
  },
  signalText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12
  },
  signalScores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151'
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center'
  },
  scoreLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#60A5FA'
  },
  signalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151'
  },
  confidence: {
    fontSize: 14,
    color: '#9CA3AF'
  },
  score: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16
  },
  infoBox: {
    marginHorizontal: 16,
    backgroundColor: '#1E40AF20',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24
  },
  infoTitle: {
    color: '#60A5FA',
    fontWeight: 'bold',
    marginBottom: 8
  },
  infoText: {
    color: '#93C5FD',
    fontSize: 12,
    marginBottom: 4
  }
});
