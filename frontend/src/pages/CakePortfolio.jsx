import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/formatting';
import { fetchPortfolioCakes } from '../utils/api';
import { toast } from 'react-toastify';
import './CakePortfolio.css';
import { DEFAULT_PLACEHOLDER_IMAGE_URL } from '../utils/constants';

const CakePortfolio = () => {
  const navigate = useNavigate();
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, perPage: 12, total: 0 });

  const categories = ['All', 'Birthday', 'Wedding', 'Anniversary', 'Corporate', 'Custom', 'Other'];

  const loadCakes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.perPage,
      };
      
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      const response = await fetchPortfolioCakes(params);
      setCakes(response.cakes || []);
      
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          pages: response.pagination.pages,
        }));
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      toast.error('Failed to load cakes portfolio');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.perPage, selectedCategory]);

  useEffect(() => {
    loadCakes();
  }, [loadCakes]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCakeClick = (cakeId) => {
    navigate(`/portfolio/${cakeId}`);
  };

  const handleOrderCustom = (cake) => {
    // Navigate to order page with pre-selected cake template
    navigate('/order', { state: { templateCake: cake } });
  };



  return (
    <div className="portfolio-page">
      <div className="container">
        {/* Header */}
        <div className="portfolio-header">
          <h1>Our Cake Portfolio</h1>
          <p>Browse our collection of beautiful pre-made cakes or customize your own!</p>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading delicious cakes...</p>
          </div>
        ) : (
          <>
            {/* Cakes Grid */}
            {cakes.length > 0 ? (
              <>
                <div className="cakes-grid">
                  {cakes.map(cake => (
                    <div key={cake.id} className="cake-card">
                      {cake.is_featured && (
                        <div className="featured-badge">⭐ Featured</div>
                      )}
                      
                      <div 
                        className="cake-image"
                        onClick={() => handleCakeClick(cake.id)}
                        style={{
                          backgroundImage: `url(${
                            cake.primary_image_url || DEFAULT_PLACEHOLDER_IMAGE_URL
                          })`,
                        }}
                      >
                        {!cake.is_available && (
                          <div className="unavailable-overlay">Currently Unavailable</div>
                        )}
                      </div>

                      <div className="cake-details">
                        <h3>{cake.name}</h3>
                        <p className="cake-description">{cake.description}</p>
                        
                        <div className="cake-specs">
                          {cake.default_shape && (
                            <span className="spec">🔷 {cake.default_shape}</span>
                          )}
                          {cake.default_size && (
                            <span className="spec">📏 {cake.default_size}</span>
                          )}
                          {cake.default_flavor && (
                            <span className="spec">🍰 {cake.default_flavor}</span>
                          )}
                        </div>

                        <div className="cake-tags">
                          {cake.can_be_vegan && (
                            <span className="tag tag-vegan">🌱 Vegan Option</span>
                          )}
                          {cake.can_be_gluten_free && (
                            <span className="tag tag-gf">🌾 Gluten-Free Option</span>
                          )}
                        </div>

                        <div className="cake-footer">
                          <p className="price">Starting at {formatPrice(cake.base_price)}</p>
                          <div className="action-buttons">
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleCakeClick(cake.id)}
                            >
                              View Details
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleOrderCustom(cake)}
                              disabled={!cake.is_available}
                            >
                              Customize & Order
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="btn btn-pagination"
                    >
                      « Previous
                    </button>
                    
                    <span className="page-info">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="btn btn-pagination"
                    >
                      Next »
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <p>😔 No cakes found in this category</p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/order')}
                >
                  Design Your Own Custom Cake
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CakePortfolio;
