//
// MongoDB API for Prudence
// Version 1.10
//
// Copyright 2010 Three Crickets LLC.
//
// The contents of this file are subject to the terms of either the MPL version
// 1.1 or the GPL version 2.0: http://www.opensource.org/licenses/mozilla1.1.php
// http://www.opensource.org/licenses/gpl-license.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

importClass(com.mongodb.rhino.BSON, com.mongodb.rhino.JSON)

var Mongo = Mongo || function() {

	var Public = {
	
		defaultConnection: null,
		defaultDB: null,
		defaultIdsCollections: null,
		
		connect: function(uris, options) {
			if (uris instanceof Array) {
				var array = new java.util.ArrayList(uris.length)
				for (var u in uris) {
					array.add(new com.mongodb.ServerAddress(uris[u]))
				}
				uris = array
			}
			else if (uris) {
				uris = new com.mongodb.ServerAddress(uris)
			}
			
			if (options) {
				var mongoOptions = new com.mongodb.MongoOptions()
				for (var key in options) {
					mongoOptions[key] = options[key]
				}
				options = mongoOptions
			}
			
			if (uris) {
				if (options) {
					return new com.mongodb.Mongo(uris, options)
				}
				else {
					return new com.mongodb.Mongo(uris)
				}
			}
			else {
				return new com.mongodb.Mongo()
			}
		},
		
		newID: function() {
			return org.bson.types.ObjectId.get()
		},
		
		id: function(id) {
			return id ? new org.bson.types.ObjectId(id) : null
		},
		
		idToString: function(id) {
			return id ? String(id.toStringMongod()) : null
		},
		
		Cursor: function(cursor) {
		
			this.hasNext = function() {
				return this.cursor.hasNext()
			}
			
			this.next = function() {
				return BSON.from(this.cursor.next())
			}
			
			this.curr = function() {
				return BSON.from(this.cursor.curr())
			}
			
			this.skip = function(n) {
				this.cursor.skip(n)
				return this
			}
			
			this.limit = function(n) {
				this.cursor.limit(n)
				return this
			}
			
			this.sort = function(orderBy) {
				this.cursor.sort(BSON.to(orderBy))
				return this
			}
			
			this.toArray = function(start, limit) {
				var array = []
				var index = 0
				while (this.hasNext()) {
					var doc = this.next()
					if ((start != null) && (index++ >= start)) {
						array.push(doc)
					}
					if (array.length == limit) {
						break
					}
				}
				return array
			}
			
			// //////////////////////////////////////////////////////////////////////////
			// Private
			
			//
			// Construction
			//
			
			this.cursor = cursor
		},
		
		Collection: function(name, config) {
		
			this.ensureIndex = function(index, options) {
				this.collection.ensureIndex(BSON.to(index), BSON.to(options))
			}
			
			this.find = function(query) {
				if (query) {
					return new Mongo.Cursor(this.collection.find(BSON.to(query)))
				}
				else {
					return new Mongo.Cursor(this.collection.find())
				}
			}
			
			this.findOne = function(query) {
				return BSON.from(this.collection.findOne(BSON.to(query)))
			}
			
			this.getCount = function(query) {
				if (query) {
					return this.collection.getCount(BSON.to(query))
				}
				else {
					return this.collection.getCount()
				}
			}
			
			this.save = function(o) {
				return this.collection.save(BSON.to(o))
			}
			
			this.insert = function(o) {
				return this.collection.insert(BSON.to(o))
			}
			
			this.update = function(q, o) {
				return this.collection.update(BSON.to(q), BSON.to(o))
			}
			
			this.remove = function(q) {
				return this.collection.remove(BSON.to(q))
			}
			
			this.findAndModify = function(q, o) {
				var r = BSON.from(this.collection.getDB().command(BSON.to({
					findandmodify: this.collection.name,
					query: q,
					update: o
				})))
				return r.ok ? r.value : null
			}
			
			this.nextID = function() {
				var id = this.idsCollection.findAndModify({
					id: this.collection.name
				}, {
					$inc: {
						next: 1
					}
				})
				if (id) {
					return id.next
				}
				else {
					Mongo.ids.insert({
						id: this.collection.name,
						next: 1
					})
					return this.nextID()
				}
			}
			
			this.insertNext = function(o) {
				o.id = this.nextID()
				return this.collection.insert(BSON.to(o))
			}
			
			// //////////////////////////////////////////////////////////////////////////
			// Private
			
			//
			// Construction
			//
			
			config = config || {}
			var db = config.db || Public.defaultDB
			if (db instanceof String) {
				db = Public.defaultConnection.getDB(db)
			}
			this.idsCollection = config.idsCollection || Public.defaultIdsCollection
			this.collection = db.getCollection(name)
			
			if (config.uniqueID) {
				var index = {}
				index[config.uniqueID] = 1
				this.ensureIndex(index, {
					unique: true
				})
			}
		}
	}
	
	// //////////////////////////////////////////////////////////////////////////
	// Private
	
	//
	// Construction
	//
	
	Public.defaultConnection = application.globals.get('mongodb.defaults.connection')
	if (!Public.defaultConnection) {
		var defaultServers = application.globals.get('mongodb.defaultServers')
		Public.defaultConnection = application.getGlobal('mongodb.defaults.connection', Public.connect(defaultServers,{
			autoConnectRetry: true
		}))
	}
	
	if (Public.defaultConnection) {
		Public.defaultDB = application.globals.get('mongodb.defaults.db')
		if (!Public.defaultDB) {
			var defaultDB = application.globals.get('mongodb.defaultDB')
			if (defaultDB) {
				Public.defaultDB = application.getGlobal('mongodb.defaults.db', Public.defaultConnection.getDB(defaultDB))
			}
		}
		
		if (Public.defaultDB) {
			Public.defaultIdsCollection = application.globals.get('mongodb.defaults.idsCollection')
			if (!Public.defaultIdsCollection) {
				var defaultIdsCollectionName = application.globals.get('mongodb.defaultIdsCollectionName')
				if (defaultIdsCollectionName) {
					Public.defaultIdsCollection = application.getGlobal('mongodb.defaults.idsCollection', new Public.Collection(defaultIdsCollectionName))
				}
			}
		}
	}
	
	return Public
}()
