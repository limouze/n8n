import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { alertsAPI } from '../api';

export default function AlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchAlerts();
    }, [])
  );

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertsAPI.getAll();
      setAlerts(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = (id) => {
    Alert.alert('Supprimer l\'alerte', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await alertsAPI.delete(id);
            fetchAlerts();
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer l\'alerte');
          }
        }
      }
    ]);
  };

  const handleToggleAlert = async (id, active) => {
    try {
      await alertsAPI.update(id, { active: !active });
      fetchAlerts();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier l\'alerte');
    }
  };

  const renderAlert = ({ item }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View>
          <Text style={styles.alertSymbol}>{item.symbol}</Text>
          <Text style={styles.alertCondition}>{item.condition}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleToggleAlert(item.id, item.active)}
          style={[
            styles.statusBadge,
            item.active ? styles.statusActive : styles.statusInactive
          ]}
        >
          <Text style={styles.statusText}>
            {item.active ? '✓ Actif' : '✗ Inactif'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.alertFooter}>
        <Text style={styles.alertDate}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteAlert(item.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertes</Text>
        <Text style={styles.subtitle}>Gérez vos alertes de trading</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('CreateAlert')}
      >
        <Text style={styles.addButtonText}>+ Nouvelle Alerte</Text>
      </TouchableOpacity>

      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAlerts} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>Aucune alerte créée</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CreateAlert')}
            >
              <Text style={styles.emptyButtonText}>Créer votre première alerte</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 À propos des alertes</Text>
        <Text style={styles.infoText}>
          Recevez des notifications quand les conditions que vous avez défini sont rencontrées sur vos actions préférées.
        </Text>
      </View>
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
  addButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20
  },
  alertCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  alertSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  alertCondition: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: 'Courier'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  statusActive: {
    backgroundColor: '#10B98120'
  },
  statusInactive: {
    backgroundColor: '#EF444420'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151'
  },
  alertDate: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600'
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center'
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 16
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1E40AF20',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    padding: 12,
    borderRadius: 8
  },
  infoTitle: {
    color: '#60A5FA',
    fontWeight: 'bold',
    marginBottom: 6
  },
  infoText: {
    color: '#93C5FD',
    fontSize: 12,
    lineHeight: 18
  }
});
