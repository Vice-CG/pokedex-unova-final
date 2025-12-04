// src/App.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import './App.css';

// Importar traducciones
import esTranslations from './locales/es.json';
import enTranslations from './locales/en.json';

// Configuración de API
const API_URL = 'http://localhost:5000/api';

// Context para idioma
const LanguageContext = createContext();
const AuthContext = createContext();

// Hook personalizado para idioma
const useLanguage = () => useContext(LanguageContext);
const useAuth = () => useContext(AuthContext);

// Servicio de API
const api = {
  // Autenticación
  register: async (username, email, password) => {
    const response = await axios.post(`${API_URL}/register`, { username, email, password });
    return response.data;
  },
  
  login: async (username, password) => {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data;
  },

  // Obtener usuario actual
  getMe: async (token) => {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
  
  // Pokémon
  getPokemon: async () => {
    const response = await axios.get(`${API_URL}/pokemon`);
    return response.data;
  },
  
  getPokemonById: async (id) => {
    const response = await axios.get(`${API_URL}/pokemon/${id}`);
    return response.data;
  },

  getPokemonDetails: async (id) => {
    const response = await axios.get(`${API_URL}/pokemon/${id}/details`);
    return response.data;
  },
  
  // Colección (requiere token)
  getCollection: async (token) => {
    const response = await axios.get(`${API_URL}/collection`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
  
  addToCollection: async (token, pokemonId, notes = '') => {
    const response = await axios.post(`${API_URL}/collection`, 
      { pokemonId, notes },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
  
  updateCollection: async (token, entryId, notes, caught) => {
    const response = await axios.put(`${API_URL}/collection/${entryId}`,
      { notes, caught },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
  
  deleteFromCollection: async (token, entryId) => {
    const response = await axios.delete(`${API_URL}/collection/${entryId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

// Componente de Header
function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = t.appTitle;
  }, [t.appTitle]);
  
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <div className="logo">
            <div className="pokeball-icon">
              <div className="pokeball-center"></div>
            </div>
            <h1>{t.appTitle}</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <button onClick={toggleLanguage} className="btn-secondary">
              🌐 {language.toUpperCase()}
            </button>

            {user ? (
              <>
                <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {user.avatar && (
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%',
                        border: '2px solid white'
                      }}
                    />
                  )}
                  <span>👤 {user.username}</span>
                </div>
                <button onClick={logout} className="btn-danger">
                  🚪 {t.auth.logout}
                </button>
              </>
            ) : null}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <button onClick={toggleLanguage} className="btn-secondary btn-block">
              🌐 {language.toUpperCase()}
            </button>
            {user && (
              <>
                <div className="user-info-mobile">
                  {user.avatar && (
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%',
                        margin: '0 auto 0.5rem'
                      }}
                    />
                  )}
                  <div>👤 {user.username}</div>
                </div>
                <button onClick={logout} className="btn-danger btn-block">
                  🚪 {t.auth.logout}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// Componente de Login/Register con SSO
function AuthModal({ isOpen, onClose, onAuth }) {
  const { t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const email = document.getElementById('auth-email')?.value;

    try {
      if (isRegister) {
        const response = await api.register(username, email, password);
        onAuth(response);
      } else {
        const response = await api.login(username, password);
        onAuth(response);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = (provider) => {
    // Redirigir al backend para iniciar SSO
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{isRegister ? t.auth.register : t.auth.login}</h2>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Botones SSO */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            onClick={() => handleSSO('google')}
            className="btn-sso btn-google"
            disabled={loading}
          >
            <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🔵</span>
            Continuar con Google
          </button>
          
          <button 
            onClick={() => handleSSO('github')}
            className="btn-sso btn-github"
            disabled={loading}
          >
            <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>⚫</span>
            Continuar con GitHub
          </button>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          margin: '1.5rem 0',
          color: '#6b7280'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#d1d5db' }}></div>
          <span style={{ padding: '0 1rem', fontSize: '0.875rem' }}>O</span>
          <div style={{ flex: 1, height: '1px', background: '#d1d5db' }}></div>
        </div>

        {/* Formulario tradicional */}
        <div className="form-group">
          <label>{t.auth.username}</label>
          <input
            id="auth-username"
            type="text"
            className="input"
            disabled={loading}
          />
        </div>

        {isRegister && (
          <div className="form-group">
            <label>{t.auth.email}</label>
            <input
              id="auth-email"
              type="email"
              className="input"
              disabled={loading}
            />
          </div>
        )}

        <div className="form-group">
          <label>{t.auth.password}</label>
          <input
            id="auth-password"
            type="password"
            className="input"
            disabled={loading}
          />
        </div>

        <div className="modal-actions">
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? t.pokemon.loading : (isRegister ? t.auth.register : t.auth.login)}
          </button>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            {t.collection.cancel}
          </button>
        </div>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="link-button"
          disabled={loading}
        >
          {isRegister ? t.auth.alreadyHaveAccount : t.auth.dontHaveAccount}
        </button>
      </div>
    </div>
  );
}

// Componente de Modal de Detalles
function PokemonDetailsModal({ isOpen, onClose, details, loading, language }) {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ overflowY: 'auto' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p>{t.details.loadingDetails}</p>
          </div>
        ) : details ? (
          <>
            {/* Header con imagen oficial */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem', borderRadius: '1rem', color: 'white' }}>
              <img 
                src={details.sprites.official || details.sprites.default} 
                alt={details.name} 
                style={{ width: '200px', height: '200px', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))' }} 
              />
              <h2 style={{ fontSize: '2.5rem', textTransform: 'capitalize', marginTop: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                {details.name[language] || details.name.es}
              </h2>
              <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>
                #{details.id.toString().padStart(3, '0')} • {details.species.genus[language] || details.species.genus.es}
              </p>
              {/* Tipos */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                {details.types.map(type => {
                  const typeColors = {
                    normal: '#A8A878', fire: '#F08030', water: '#6890F0',
                    grass: '#78C850', electric: '#F8D030', ice: '#98D8D8',
                    fighting: '#C03028', poison: '#A040A0', ground: '#E0C068',
                    flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
                    rock: '#B8A038', ghost: '#705898', dragon: '#7038F8',
                    dark: '#705848', steel: '#B8B8D0', fairy: '#EE99AC'
                  };
                  return (
                    <span key={type} style={{
                      padding: '0.5rem 1.5rem',
                      background: typeColors[type] || '#68A090',
                      borderRadius: '50px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}>
                      {t.types[type] || type}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Descripción Pokédex */}
            <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{t.details.pokedexDescription}</span>
              </h3>
              <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '1rem' }}>
                {details.descriptions[language] || details.descriptions.es}
              </p>
            </div>

            {/* Datos físicos y de captura */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ color: '#1e40af', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '600' }}>{t.details.height}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e3a8a' }}>{details.height} m</p>
              </div>
              <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ color: '#92400e', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '600' }}>{t.details.weight}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#78350f' }}>{details.weight} kg</p>
              </div>
              <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ color: '#166534', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '600' }}>{t.details.captureRate}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#14532d' }}>{details.species.captureRate}</p>
              </div>
              <div style={{ background: '#fce7f3', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ color: '#9f1239', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '600' }}>{t.details.happiness}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#881337' }}>{details.species.baseHappiness}</p>
              </div>
            </div>

            {/* Stats Base */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{t.details.baseStats}</span>
                <span style={{ marginLeft: 'auto', background: '#3b82f6', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.875rem' }}>
                  {t.details.total}: {details.totalStats}
                </span>
              </h3>
              {details.stats.map(stat => (
                <div key={stat.name} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>{t.stats[stat.name] || stat.name}</span>
                    <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{stat.value}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '50px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                      background: stat.value > 120 ? '#10b981' : stat.value > 80 ? '#3b82f6' : stat.value > 50 ? '#f59e0b' : '#ef4444',
                      width: `${Math.min((stat.value / 255) * 100, 100)}%`,
                      height: '100%',
                      borderRadius: '50px',
                      transition: 'width 0.5s ease'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Habilidades */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{t.details.abilities}</span>
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {details.abilities.map((ability, idx) => (
                <span key={idx} style={{ 
                  padding: '0.625rem 1.25rem', 
                  background: ability.isHidden ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                  color: 'white',
                  borderRadius: '50px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {ability.name[language] || ability.name.es} {ability.isHidden && `🔒 (${t.details.hidden})`}
                </span>
              ))}
              </div>
            </div>

            {/* Cadena Evolutiva */}
            {details.evolutionChain && details.evolutionChain.length > 1 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{t.details.evolutionChain}</span>
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflowX: 'auto', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
                  {details.evolutionChain.map((evo, idx) => (
                    <React.Fragment key={idx}>
                      <div style={{ textAlign: 'center', minWidth: '120px' }}>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                          <p style={{ fontWeight: '600', fontSize: '1rem', color: '#1f2937' }}>
                            {evo.name[language] || evo.name.es}
                          </p>
                          {evo.minLevel && (
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                              {t.details.level} {evo.minLevel}
                            </p>
                          )}
                          {evo.item && (
                            <p style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '0.25rem', textTransform: 'capitalize' }}>
                              {evo.item.replace('-', ' ')}
                            </p>
                          )}
                        </div>
                      </div>
                      {idx < details.evolutionChain.length - 1 && (
                        <span style={{ fontSize: '2rem', color: '#9ca3af', fontWeight: 'bold' }}>→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Botón cerrar */}
            <button 
              onClick={onClose} 
              style={{ 
                width: '100%', 
                padding: '1rem', 
                background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '0.75rem', 
                cursor: 'pointer', 
                fontSize: '1rem', 
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
            >
              ✕ {t.pokemon.closeDetails}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

// Componente de PokemonCard
function PokemonCard({ pokemon, collection, onAdd, onRemove, onUpdate, token, onViewDetails }) {
  const { t } = useLanguage();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const collectionEntry = collection.find(entry => entry.pokemonId === pokemon.id);
  const isInCollection = !!collectionEntry;

  const handleSaveNotes = async () => {
    if (collectionEntry) {
      await onUpdate(collectionEntry._id || collectionEntry.id, notes);
      setEditingNotes(false);
    }
  };

  useEffect(() => {
    if (collectionEntry) {
      setNotes(collectionEntry.notes || '');
    }
  }, [collectionEntry]);

  // Colores por tipo
  const typeColors = {
    normal: '#A8A878', fire: '#F08030', water: '#6890F0',
    grass: '#78C850', electric: '#F8D030', ice: '#98D8D8',
    fighting: '#C03028', poison: '#A040A0', ground: '#E0C068',
    flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
    rock: '#B8A038', ghost: '#705898', dragon: '#7038F8',
    dark: '#705848', steel: '#B8B8D0', fairy: '#EE99AC'
  };

  return (
    <div className="pokemon-card">
      <div className="pokemon-number">#{pokemon.number}</div>
      
      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        className="pokemon-sprite"
      />
      
      <h3 className="pokemon-name">{pokemon.name}</h3>
      
      <div className="pokemon-types">
        {pokemon.types.map(type => (
          <span
            key={type}
            className="type-badge"
            style={{ backgroundColor: typeColors[type] || '#68A090' }}
          >
            {t.types[type] || type}
          </span>
        ))}
      </div>

      <button 
        onClick={() => onViewDetails(pokemon.id)} 
        className="btn-primary btn-sm"
        style={{ width: '100%', marginTop: '0.75rem', marginBottom: '0.5rem' }}
      >
        {t.pokemon.viewDetails}
      </button>

      {token && (
        <div className="pokemon-actions">
          {isInCollection ? (
            <div className="collection-controls">
              {editingNotes ? (
                <>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={t.collection.addNotes}
                    className="notes-input"
                  />
                  <div className="button-group">
                    <button onClick={handleSaveNotes} className="btn-success btn-sm">
                      💾 {t.collection.save}
                    </button>
                    <button
                      onClick={() => setEditingNotes(false)}
                      className="btn-secondary btn-sm"
                    >
                      {t.collection.cancel}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {collectionEntry.notes && (
                    <p className="pokemon-notes">"{collectionEntry.notes}"</p>
                  )}
                  <div className="button-group">
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="btn-primary btn-sm"
                    >
                      ✏️ {t.collection.edit}
                    </button>
                    <button
                      onClick={() => onRemove(collectionEntry._id || collectionEntry.id)}
                      className="btn-danger btn-sm"
                    >
                      🗑️ {t.collection.delete}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={() => onAdd(pokemon.id)} className="btn-success">
              ➕ {t.collection.addToCollection}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Componente principal
export default function App() {
  const [language, setLanguage] = useState('es');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pokemon, setPokemon] = useState([]);
  const [collection, setCollection] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all');
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPokemonDetails, setSelectedPokemonDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const translations = language === 'es' ? esTranslations : enTranslations;

  // Cargar Pokémon al inicio
  useEffect(() => {
    loadPokemon();
  }, []);

  // Verificar token al cargar y manejar SSO callback
  useEffect(() => {
    // Verificar si venimos del callback de SSO
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromSSO = urlParams.get('token');
    
    if (tokenFromSSO) {
      // Limpiar la URL
      window.history.replaceState({}, document.title, '/');
      handleAuth({ token: tokenFromSSO });
    } else if (token) {
      verifyTokenAndLoadUser();
    }
  }, [token]);

  const loadPokemon = async () => {
    try {
      setLoading(true);
      const data = await api.getPokemon();
      setPokemon(data);
    } catch (error) {
      console.error('Error loading pokemon:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPokemonDetails = async (pokemonId) => {
    try {
      setLoadingDetails(true);
      setShowDetailsModal(true);
      setSelectedPokemonDetails(null);
      const data = await api.getPokemonDetails(pokemonId);
      setSelectedPokemonDetails(data);
    } catch (error) {
      console.error('Error loading pokemon details:', error);
      alert('Error al cargar los detalles del Pokémon');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const verifyTokenAndLoadUser = async () => {
    try {
      const userData = await api.getMe(token);
      setUser(userData);
      loadCollection(token);
    } catch (error) {
      console.error('Token inválido:', error);
      logout();
    }
  };

  const handleAuth = (response) => {
    setToken(response.token);
    if (response.user) {
      setUser(response.user);
    }
    localStorage.setItem('token', response.token);
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    loadCollection(response.token);
    // Cargar datos del usuario desde el backend
    verifyTokenAndLoadUser();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCollection([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const loadCollection = async (authToken) => {
    try {
      const data = await api.getCollection(authToken || token);
      setCollection(data);
    } catch (error) {
      console.error('Error loading collection:', error);
    }
  };

  const addToCollection = async (pokemonId) => {
    try {
      await api.addToCollection(token, pokemonId, '');
      loadCollection();
    } catch (error) {
      console.error('Error adding to collection:', error);
    }
  };

  const removeFromCollection = async (entryId) => {
    try {
      await api.deleteFromCollection(token, entryId);
      loadCollection();
    } catch (error) {
      console.error('Error removing from collection:', error);
    }
  };

  const updateNotes = async (entryId, notes) => {
    try {
      await api.updateCollection(token, entryId, notes, true);
      loadCollection();
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'es' ? 'en' : 'es');
  };

  const filteredPokemon = pokemon.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.number.includes(searchTerm)
  );

  const displayedPokemon = view === 'collection'
    ? filteredPokemon.filter(p => collection.some(c => c.pokemonId === p.id))
    : filteredPokemon;

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t: translations }}>
      <AuthContext.Provider value={{ user, token, logout }}>
        <div className="app">
          <Header />

          <main className="main-content">
            <div className="container">
              {/* Search Bar */}
              <div className="search-bar">
                <input
                  type="text"
                  placeholder={translations.pokemon.search}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Action Bar */}
              <div className="action-bar">
                {!user ? (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="btn-primary btn-lg"
                  >
                    🔐 {translations.auth.login}
                  </button>
                ) : (
                  <div className="view-toggle">
                    <button
                      onClick={() => setView('all')}
                      className={view === 'all' ? 'btn-primary' : 'btn-secondary'}
                    >
                      {translations.collection.allPokemon}
                    </button>
                    <button
                      onClick={() => setView('collection')}
                      className={view === 'collection' ? 'btn-primary' : 'btn-secondary'}
                    >
                      {translations.collection.myCollection} ({collection.length})
                    </button>
                  </div>
                )}
              </div>

              {/* Loading */}
              {loading && (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>{translations.pokemon.loading}</p>
                </div>
              )}

              {/* Pokemon Grid */}
              {!loading && (
                <div className="pokemon-grid">
                  {displayedPokemon.map(p => (
                    <PokemonCard
                      key={p.id}
                      pokemon={p}
                      collection={collection}
                      onAdd={addToCollection}
                      onRemove={removeFromCollection}
                      onUpdate={updateNotes}
                      token={token}
                      onViewDetails={loadPokemonDetails}
                    />
                  ))}
                </div>
              )}

              {/* No Results */}
              {!loading && displayedPokemon.length === 0 && (
                <div className="no-results">
                  <p>{translations.pokemon.noResults}</p>
                </div>
              )}
            </div>
          </main>

          <footer className="footer">
            <div className="container">
              <p>{translations.footer.description}</p>
              <p className="footer-tech">{translations.footer.tech}</p>
            </div>
          </footer>

          {/* Auth Modal */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onAuth={handleAuth}
          />

          {/* Modal de Detalles */}
          <PokemonDetailsModal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            details={selectedPokemonDetails}
            loading={loadingDetails}
            language={language}
          />
        </div>
      </AuthContext.Provider>
    </LanguageContext.Provider>
  );
}