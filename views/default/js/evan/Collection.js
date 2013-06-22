define(function(require) {
	/**
	 * Manages an Activity-Streams style collection.
	 * @param {Object} data
	 * @param {angular.$http} $http
	 * 
	 * @constructor
	 * @ngInject
	 */
	function Collection(data, $http) {
		/** @private */
		this.data = data;
		
		/** @private */
		this.$http = $http;
	};

	/**
	 * @return {number} How many items are left to load.
	 */
	Collection.prototype.getRemainingItemsCount = function() {
		return this.data.totalItems - this.data.items.length;
	};

	/**
	 * @return {boolean} Whether there are an items left to load.
	 */
	Collection.prototype.hasRemainingItems = function() {
		return this.getRemainingItemsCount() > 0;
	};

	/**
	 * @return {!Array} The local items in this collection.
	 */
	Collection.prototype.getItems = function() {
		return this.data.items || [];
	};

	/**
	 * @return {number} The total number of items in this collection on the server.
	 */
	Collection.prototype.getTotalItems = function() {
		return this.data.totalItems;
	};

	/**
	 * @todo Rename to "push()"
	 */
	Collection.prototype.appendItem = function(item) {
		this.data.items.push(item);
	};
	
	/**
	 * Add all the items in the given collection to this one, filtering duplicates.
	 * @todo Rename to "concat()"
	 * @private
	 */
	Collection.prototype.appendCollection = function(newCollection) {
		this.data.totalItems = newCollection.totalItems;
		newCollection.items.forEach(this.appendItem, this);
		this.data.links.next = newCollection.items.length ? newCollection.links.next : null;
	};

	/**
	 * Used as callback to force isLoadingNextItems to return false.
	 * @private
	 */
	Collection.prototype.resetLoadingNext = function() {
		this.loadingNextItems = null;
	};
	
	/**
	 * Initiate fetch of unloaded items from server.
	 */
	Collection.prototype.loadNextItems = function() {
		if (!this.hasNextItems()) {
			throw new Error('There are no more items to load!');	
		}
	
		if (this.loadingNextItems) {
			// Loading in progress. Don't trigger two loads at once!
			return this.loadingNextItems;	
		}
	
		var resetLoadingNext = this.resetLoadingNext.bind(this);
		return this.loadingNextItems = this.$http_.get(this.data.links.next.href).
			then(this.appendCollection.bind(this)).
			then(resetLoadingNext, resetLoadingNext);
	};

	/**
	 * @return {boolean} Whether there are items to load that are "after" the ones already loaded.
	 */
	Collection.prototype.hasNextItems = function() {
		return !!(this.data.links && this.data.links.next);
	};

	/**
	 * @return {boolean} Whether we are currently waiting for the next items to be loaded from the server.
	 */
	Collection.prototype.isLoadingNextItems = function() {
		return !!this.loadingNextItems;
	};
	
	/**
	 * @return {string} The time of the least recently published object.
	 */
	Collection.prototype.getOldestPublishedTime = function() {
		return this.data.items.map(function(object) { 
			return object.published; 
		}).sort()[0];
	};
	
	/**
	 * @return {number} The index of the given entity using "guid" as equality as opposed to pointer equality.
	 */
	Collection.prototype.indexOfEntity = function(entity) {
		var index = -1;
		
		this.data.items.forEach(function(item, idx) {
			if (item.guid == entity.guid) {
				index = idx;
			}
		});
		
		return index;
	};

	/**
	 * @return {number} The index of the given annotation using "annotation_id" as equality as opposed to pointer equality.
	 */
	Collection.prototype.indexOfAnnotation = function(annotation) {
		var index = -1;
		
		this.data.items.forEach(function(item, idx) {
			if (item.annotation_id == annotation.annotation_id) {
				index = idx;
			}
		});
		
		return index;
	};

	return Collection;
});