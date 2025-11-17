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
  
  // Pokémon
  getPokemon: async () => {
    const response = await axios.get(`${API_URL}/pokemon`);
    return response.data;
  },
  
  getPokemonById: async (id) => {
    const response = await axios.get(`${API_URL}/pokemon/${id}`);
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
                <span className="user-info">👤 {user.username}</span>
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
                <div className="user-info-mobile">👤 {user.username}</div>
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

// Componente de Login/Register
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{isRegister ? t.auth.register : t.auth.login}</h2>

        {error && <div className="alert alert-error">{error}</div>}

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

// Componente de PokemonCard
function PokemonCard({ pokemon, collection, onAdd, onRemove, onUpdate, token }) {
  const { t } = useLanguage();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const collectionEntry = collection.find(entry => entry.pokemonId === pokemon.id);
  const isInCollection = !!collectionEntry;

  const handleSaveNotes = async () => {
    if (collectionEntry) {
      await onUpdate(collectionEntry.id, notes);
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
                      onClick={() => onRemove(collectionEntry.id)}
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
  const [view, setView] = useState('all'); // 'all' | 'collection'

  const translations = language === 'es' ? esTranslations : enTranslations;

  // Cargar Pokémon al inicio
  useEffect(() => {
    loadPokemon();
  }, []);

  // Cargar colección si hay usuario
  useEffect(() => {
    if (token) {
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

  const verifyTokenAndLoadUser = async () => {
    try {
      const collectionData = await api.getCollection(token);
      setCollection(collectionData);
      // Token válido, mantener sesión
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);
    } catch (error) {
      // Token inválido
      logout();
    }
  };

  const handleAuth = (response) => {
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    loadCollection(response.token);
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
        </div>
      </AuthContext.Provider>
    </LanguageContext.Provider>
  );
}