import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { stocksAPI } from '../api';

export default function StockDetailScreen({ route, navigation }) {
  const { symbol } = route.params;
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, [symbol]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const response = await stocksAPI.getOne(symbol);
      setStock(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#60A5FA" />
        </View>
      </SafeAreaView>
    );
  }

  if (!stock) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Action non trouvée</Text>
        </View>
      </SafeAreaView>
    );
  }

  const indicators = stock.indicators || {};
  const lastSignal = stock.lastSignal;

  const getIndicatorColor = (signal) => {
    if (signal === 'bullish') return '#10B981';
    if (signal === 'bearish') return '#EF4444';
    return '#6B7280';
  };

  const getIndicatorText = (signal) => {
    if (signal === 'bullish') return 'HAUSSIER';
    if (signal === 'bearish') return 'BAISSIER';
    return 'NEUTRE';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Retour</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.symbol}>{stock.symbol}</Text>
            <Text style={styles.name}>{stock.name}</Text>
          </View>
        </View>

        {/* Signal Summary */}
        {lastSignal && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Dernier Signal</Text>
            <View style={styles.signalSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Signal</Text>
                <View
                  style={[
                    styles.signalBadge,
                    {
                      backgroundColor:
                        lastSignal.signal === 'ACHAT'
                          ? '#10B981'
                          : lastSignal.signal === 'VENTE'
                          ? '#EF4444'
                          : '#6B7280'
                    }
                  ]}
                >
                  <Text style={styles.signalBadgeText}>{lastSignal.signal}</Text>
                </View>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Score</Text>
                <Text style={styles.summaryValue}>{lastSignal.score}/100</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Confiance</Text>
                <Text style={styles.summaryValue}>{lastSignal.confidence}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Scores Détaillés</Text>
          <View style={styles.scoresGrid}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>Technique</Text>
              <Text style={[styles.scoreCardValue, { color: '#60A5FA' }]}>
                {lastSignal?.technicalScore || 0}%
              </Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>Fondamental</Text>
              <Text style={[styles.scoreCardValue, { color: '#A78BFA' }]}>
                {stock.fundamentalScore || 0}%
              </Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>Actualités</Text>
              <Text style={[styles.scoreCardValue, { color: '#F59E0B' }]}>
                {stock.newsScore || 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Indicators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Indicateurs Techniques</Text>
          {indicators && Object.keys(indicators).length > 0 ? (
            <>
              <View style={styles.indicator}>
                <View style={styles.indicatorContent}>
                  <Text style={styles.indicatorName}>RSI (14)</Text>
                  <Text style={styles.indicatorValue}>{indicators.rsi?.value || 'N/A'}</Text>
                </View>
                <Text
                  style={[
                    styles.indicatorSignal,
                    { color: getIndicatorColor(indicators.rsi?.signal) }
                  ]}
                >
                  {getIndicatorText(indicators.rsi?.signal)}
                </Text>
              </View>

              <View style={styles.indicator}>
                <View style={styles.indicatorContent}>
                  <Text style={styles.indicatorName}>MACD</Text>
                  <Text style={styles.indicatorValue}>{indicators.macd?.value || 'N/A'}</Text>
                </View>
                <Text
                  style={[
                    styles.indicatorSignal,
                    { color: getIndicatorColor(indicators.macd?.signal) }
                  ]}
                >
                  {getIndicatorText(indicators.macd?.signal)}
                </Text>
              </View>

              <View style={styles.indicator}>
                <View style={styles.indicatorContent}>
                  <Text style={styles.indicatorName}>MM20</Text>
                  <Text style={styles.indicatorValue}>{indicators.mm20?.value || 'N/A'}</Text>
                </View>
                <Text
                  style={[
                    styles.indicatorSignal,
                    { color: getIndicatorColor(indicators.mm20?.signal) }
                  ]}
                >
                  {getIndicatorText(indicators.mm20?.signal)}
                </Text>
              </View>

              <View style={styles.indicator}>
                <View style={styles.indicatorContent}>
                  <Text style={styles.indicatorName}>MM50</Text>
                  <Text style={styles.indicatorValue}>{indicators.mm50?.value || 'N/A'}</Text>
                </View>
                <Text
                  style={[
                    styles.indicatorSignal,
                    { color: getIndicatorColor(indicators.mm50?.signal) }
                  ]}
                >
                  {getIndicatorText(indicators.mm50?.signal)}
                </Text>
              </View>

              <View style={styles.indicator}>
                <View style={styles.indicatorContent}>
                  <Text style={styles.indicatorName}>Stochastique</Text>
                  <Text style={styles.indicatorValue}>{indicators.stochastique?.value || 'N/A'}</Text>
                </View>
                <Text
                  style={[
                    styles.indicatorSignal,
                    { color: getIndicatorColor(indicators.stochastique?.signal) }
                  ]}
                >
                  {getIndicatorText(indicators.stochastique?.signal)}
                </Text>
              </View>

              <View style={styles.indicator}>
                <View style={styles.indicatorContent}>
                  <Text style={styles.indicatorName}>VWAP</Text>
                  <Text style={styles.indicatorValue}>{indicators.vwap?.value || 'N/A'}</Text>
                </View>
                <Text
                  style={[
                    styles.indicatorSignal,
                    { color: getIndicatorColor(indicators.vwap?.signal) }
                  ]}
                >
                  {getIndicatorText(indicators.vwap?.signal)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noData}>Données non disponibles</Text>
          )}
        </View>

        {/* Fundamentals */}
        {stock.fundamentals && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💼 Données Fondamentales</Text>
            <View style={styles.fundamentalsGrid}>
              <View style={styles.fundamentalItem}>
                <Text style={styles.fundamentalLabel}>P/E</Text>
                <Text style={styles.fundamentalValue}>{stock.fundamentals.per}</Text>
              </View>
              <View style={styles.fundamentalItem}>
                <Text style={styles.fundamentalLabel}>P/B</Text>
                <Text style={styles.fundamentalValue}>{stock.fundamentals.pbRatio}</Text>
              </View>
              <View style={styles.fundamentalItem}>
                <Text style={styles.fundamentalLabel}>Dividende</Text>
                <Text style={styles.fundamentalValue}>{stock.fundamentals.dividende}%</Text>
              </View>
              <View style={styles.fundamentalItem}>
                <Text style={styles.fundamentalLabel}>Croissance</Text>
                <Text style={styles.fundamentalValue}>{stock.fundamentals.croissanceCA}%</Text>
              </View>
              <View style={[styles.fundamentalItem, { width: '50%' }]}>
                <Text style={styles.fundamentalLabel}>Marge</Text>
                <Text style={styles.fundamentalValue}>{stock.fundamentals.margeNette}%</Text>
              </View>
            </View>
          </View>
        )}

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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 16
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16
  },
  backButton: {
    color: '#60A5FA',
    fontSize: 14,
    marginBottom: 8
  },
  symbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  name: {
    fontSize: 14,
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
  signalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center'
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  signalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  signalBadgeText: {
    color: '#fff',
    fontWeight: '600'
  },
  scoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center'
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  scoreCardLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8
  },
  scoreCardValue: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  indicator: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  indicatorContent: {
    flex: 1
  },
  indicatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB'
  },
  indicatorValue: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4
  },
  indicatorSignal: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  noData: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20
  },
  fundamentalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  fundamentalItem: {
    width: '32.33%',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  fundamentalLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6
  },
  fundamentalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  }
});
