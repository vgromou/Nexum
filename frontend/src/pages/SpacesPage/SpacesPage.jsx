import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Archive, Users, FolderOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApiCall } from '../../hooks/useApiCall';
import { getSpaces } from '../../api/spacesApi';
import './SpacesPage.css';

const ROLE_LABELS = {
  Owner: 'Owner',
  Administrator: 'Admin',
  Editor: 'Editor',
  Viewer: 'Viewer',
};

const SpaceCard = ({ space, onClick }) => {
  const icon = space.icon || 'folder';

  return (
    <button className="space-card" onClick={onClick} type="button">
      <div className="space-card__icon">{icon}</div>
      <div className="space-card__body">
        <div className="space-card__name">{space.name}</div>
        {space.description && (
          <div className="space-card__description">{space.description}</div>
        )}
        <div className="space-card__meta">
          <span className="space-card__meta-item">
            <Users size={14} />
            {space.memberCount}
          </span>
          <span className="space-card__meta-item">
            <FolderOpen size={14} />
            {space.collectionsCount}
          </span>
          <span className="space-card__role">
            {ROLE_LABELS[space.roleInSpace] || space.roleInSpace}
          </span>
        </div>
      </div>
    </button>
  );
};

const SpacesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { call, loading } = useApiCall();

  const [spaces, setSpaces] = useState([]);
  const [search, setSearch] = useState('');
  const [totalItems, setTotalItems] = useState(0);

  const fetchSpaces = useCallback(
    async (searchQuery = '') => {
      const params = { page: 1, pageSize: 50 };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const { data } = await call(() => getSpaces(params));
      if (data) {
        setSpaces(data.items);
        setTotalItems(data.totalItems);
      }
    },
    [call]
  );

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSpaces(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, fetchSpaces]);

  const handleSpaceClick = (space) => {
    navigate(`/spaces/${space.id}`);
  };

  const firstName = user?.firstName || '';

  return (
    <div className="spaces-page">
      <div className="spaces-page__content">
        <header className="spaces-page__header">
          <h1 className="spaces-page__title">
            {firstName ? `${firstName}, ` : ''}
            {''}
          </h1>
          <p className="spaces-page__subtitle">
            {totalItems}{' '}
            {totalItems === 1
              ? 'space'
              : totalItems >= 2 && totalItems <= 4
                ? 'spaces'
                : 'spaces'}
          </p>
        </header>

        <div className="spaces-page__toolbar">
          <div className="spaces-page__search">
            <Search size={16} className="spaces-page__search-icon" />
            <input
              type="text"
              className="spaces-page__search-input"
              placeholder="Search spaces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && spaces.length === 0 ? (
          <div className="spaces-page__loading">
            <div className="spaces-page__spinner" />
          </div>
        ) : spaces.length === 0 ? (
          <div className="spaces-page__empty">
            <Archive size={48} strokeWidth={1} />
            <p>
              {search
                ? 'No spaces found'
                : 'No spaces yet'}
            </p>
          </div>
        ) : (
          <div className="spaces-page__grid">
            {spaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                onClick={() => handleSpaceClick(space)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpacesPage;
