import React, { useState, useEffect } from 'react';
import { alertsAPI, stocksAPI } from '../api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ symbol: '', condition: 'signal == ACHAT' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [alertsRes, stocksRes] = await Promise.all([
        alertsAPI.getAll(),
        stocksAPI.getAll()
      ]);
      setAlerts(alertsRes.data);
      setStocks(stocksRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      await alertsAPI.create(formData.symbol, formData.condition);
      setFormData({ symbol: '', condition: 'signal == ACHAT' });
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await alertsAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const handleToggleAlert = async (id, active) => {
    try {
      await alertsAPI.update(id, { active: !active });
      fetchData();
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Alertes</h1>
          <p className="text-gray-400">Gérez vos alertes de trading</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          + Nouvelle Alerte
        </button>
      </div>

      {/* Create Alert Form */}
      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">Créer une nouvelle alerte</h2>
          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Action
              </label>
              <select
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                required
              >
                <option value="">Sélectionner une action...</option>
                {stocks.map(stock => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="signal == ACHAT">Signal ACHAT</option>
                <option value="signal == VENTE">Signal VENTE</option>
                <option value="score > 70">Score > 70 (Très Haussier)</option>
                <option value="score < 30">Score < 30 (Très Baissier)</option>
                <option value="confidence == Forte">Confiance Forte</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="btn-primary"
              >
                Créer l'alerte
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts List */}
      <div className="card">
        {loading ? (
          <p className="text-gray-400">Chargement...</p>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Aucune alerte créée</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Créer votre première alerte
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-600">
                <tr className="text-gray-400 text-left">
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Condition</th>
                  <th className="pb-3">Statut</th>
                  <th className="pb-3">Créée le</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-700/30 transition">
                    <td className="py-4 font-semibold">{alert.symbol}</td>
                    <td className="py-4 text-gray-300">
                      <code className="bg-gray-700 px-2 py-1 rounded text-xs">
                        {alert.condition}
                      </code>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleToggleAlert(alert.id, alert.active)}
                        className={`px-3 py-1 rounded text-sm font-semibold transition ${
                          alert.active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {alert.active ? '✓ Actif' : '✗ Inactif'}
                      </button>
                    </td>
                    <td className="py-4 text-gray-400">
                      {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-3">💡 Alertes en temps réel</h3>
          <p className="text-sm text-gray-400">
            Recevez des notifications quand les conditions que vous avez défini sont rencontrées sur vos actions préférées.
          </p>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">🔔 Conditions disponibles</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Nouveau signal ACHAT ou VENTE</li>
            <li>• Score très élevé ou très faible</li>
            <li>• Confiance forte détectée</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
