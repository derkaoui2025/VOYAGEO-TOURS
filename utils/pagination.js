/**
 * Pagination Utility
 * 
 * Provides standardized pagination functionality for use across the application.
 * Handles calculation of pagination metadata, page links, and pagination controls.
 */

/**
 * Generate pagination metadata
 * 
 * @param {Number} total - Total number of items
 * @param {Number} page - Current page (1-indexed)
 * @param {Number} limit - Items per page
 * @param {String} baseUrl - Base URL for generating page links (without query params)
 * @param {Object} query - Additional query parameters to include in page links
 * @returns {Object} Pagination metadata
 */
function getPaginationData(total, page = 1, limit = 10, baseUrl = '', query = {}) {
  // Ensure values are valid numbers
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, parseInt(limit) || 10);
  total = Math.max(0, parseInt(total) || 0);
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;
  const skip = (page - 1) * limit;
  
  // Create URL query string from additional parameters
  const queryString = Object.entries(query)
    .filter(([key]) => key !== 'page') // Remove page param if present
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  // Base URL for pagination links
  const urlPrefix = baseUrl + (queryString ? `?${queryString}&` : '?');
  
  // Generate page links
  const firstPageUrl = urlPrefix + 'page=1';
  const prevPageUrl = hasPrevPage ? urlPrefix + `page=${page - 1}` : null;
  const nextPageUrl = hasNextPage ? urlPrefix + `page=${page + 1}` : null;
  const lastPageUrl = urlPrefix + `page=${totalPages}`;
  
  // Generate array of page numbers to display (for UI pagination controls)
  const visiblePages = 5; // Number of page links to show
  let startPage = Math.max(1, page - Math.floor(visiblePages / 2));
  let endPage = startPage + visiblePages - 1;
  
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - visiblePages + 1);
  }
  
  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push({
      number: i,
      url: urlPrefix + `page=${i}`,
      isCurrent: i === page
    });
  }
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasPrevPage,
    hasNextPage,
    prevPage: hasPrevPage ? page - 1 : null,
    nextPage: hasNextPage ? page + 1 : null,
    skip,
    pages,
    firstPageUrl,
    prevPageUrl,
    nextPageUrl,
    lastPageUrl
  };
}

/**
 * Apply pagination to a MongoDB query
 * 
 * @param {Object} query - Mongoose query object
 * @param {Number} page - Current page (1-indexed)
 * @param {Number} limit - Items per page
 * @returns {Object} Updated query with pagination applied
 */
function paginateQuery(query, page = 1, limit = 10) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, parseInt(limit) || 10);
  const skip = (page - 1) * limit;
  
  return query.skip(skip).limit(limit);
}

/**
 * Get paginated results and metadata
 * 
 * @param {Object} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - Query options (sort, populate, etc.)
 * @param {Number} page - Current page (1-indexed)
 * @param {Number} limit - Items per page
 * @param {String} baseUrl - Base URL for pagination links
 * @param {Object} query - Additional query parameters
 * @returns {Promise<Object>} Paginated results and metadata
 */
async function getPaginatedResults(model, filter = {}, options = {}, page = 1, limit = 10, baseUrl = '', query = {}) {
  const { sort = {}, populate = '', select = '' } = options;
  
  // Get total count for pagination
  const total = await model.countDocuments(filter);
  
  // Get paginated data
  const data = await model.find(filter)
    .sort(sort)
    .select(select)
    .populate(populate)
    .skip((page - 1) * limit)
    .limit(limit);
  
  // Get pagination metadata
  const pagination = getPaginationData(total, page, limit, baseUrl, query);
  
  return {
    data,
    pagination
  };
}

module.exports = {
  getPaginationData,
  paginateQuery,
  getPaginatedResults
};