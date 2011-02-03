//
// MongoDB API for Prudence
// Version 1.22
//
// Copyright 2010-2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.opensource.org/licenses/apache2.0.php
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

//
// Mongo.Collection:
//
//   constructor(name, config):
//
//     The following optional config specs are supported:
//
//     db:
//       The name of the MongoDB or an instance of the database object. If not supplied,
//       uses the 'mongo.defaultDB' application global.
//
//     connection:
//       A MongoDB connection instance created by Mongo.connect (see below). If not
//       supplied, uses the default connection instance as defined by the
//       'mongo.defaultServers' application global. If 'mongo.defaultServers'
//       is also not supplied, localhost will be used at the default port.
//
//     uniqueID:  
//       If supplied, ensureIndex will automatically be called on the key. 
//
//     idsCollection:
//       The name of the IDs collection used for insertNext and nextID (see below).
//       If not supplied, the value of the 'mongo.defaultsIdsCollectionName' will be
//       used instead.
//
//   Most of the methods should be familiar from the common MongoDB APIs. A few changes
//   and additions:
//
//     update(query, update, multi, writeConcern):
//       Is a multi-document update when multi (optional) is true, otherwise
//       single-document. The writeConcern (optional) can be a boolean (fsync),
//       a number (w) or a combined object in the form {w: number, timout: number,
//       fsync: boolean}, where fsync is optional. Make sure that 'w' is at least
//       1 if you want to receive the update results.
//
//     upsert(query, update, multi, writeConcern):
//       As above, but is an upsert.
//
//     nextID():
//       Returns the next serial integer reserved for this collection, allowing you
//       to create unique integer IDs as an alternative or supplement to MongoDB's
//       default use of ObjectIds for the _id. Note that the IDs are increased
//       atomically, guaranteeing that all calls to nextID() return unique numbers.
//
//       This feature works by storing counters per collection in a specially
//       reserved collection. See the 'idsCollection' config spec, above.
//
//     insertNext(doc):
//       As insert(doc), except that an "id" key is added with a call to nextID(). 
//
//     find(query):
//       Returns a MongoDB cursor, supporting the common MongoDB API. Useful
//       additions:
//
//         cursor.toArray():
//           Reads all documents into a standard JavaScript array. You may want to
//           call cursor.skip() and cursor.limit() first.
//
//         Note that many cursor operations return themselves, and are thus
//         chainable. For example:
//
//           var array = cursor.skip(100).limit(10).toArray()
//
// Utility API:
//
//   Mongo.connect(uris, options):
//     Creates a MongoDB connection instance. The instance automatically manages a
//     connection pool and is reusable, such that multiple instances should not
//     normally be created for the same set of servers. This means that you'd likely
//     want to store the instance in Prudence's application.globals are even in
//     executable.globals.
//
//     The uris argument can be either a single URI or an array of URIs, in the form
//     of "host" or "host:port". "host" can be an IP address or domain name. When
//     multiple URIs are used, the MongoDB connection is created in 'replica set'
//     mode. The options argument (optional) can include the following specs:
//
//       Pool management:
//
//       connectionsPerHost:
//         pool size per host
//       maxWaitTime:
//          milliseconds allowed for a thread to block before an exception is thrown
//       threadsAllowedToBlockForConnectionMultiplier:
//          multiply this by connectionsPerHost to get the number of threads allowed
//          to block before an exception is thrown
//
//       Connection management:
//
//       autoConnectRetry:
//         boolean
//       connectTimeout:
//         milliseconds allowed for connection to be made before an exception is
//         thrown
//
//       Networking:
//
//       socketTimeout:
//         milliseconds allowed for a socket operation before an exception is thrown
//
//     To get a DB instance from a connection instance, use connection.getDB(name).
//     You can pass these DB instances as the DB config spec in the Mongo.Collection
//     constructor. The same instance will be reused over multiple calls to
//     connection.getDB().
//
//   Mongo.newID():
//     Created a unique MongoDB ObjectId instance.
//
//   Mongo.id(string):
//     Turns a correctly formatted string into a MongoDB ObjectId instance. Note
//     that the reverse is achieved via the regular JavaScript String(id) casting.
//
//   Mongo.writeConcern(object):
//     Creates a write result (see collection's update(), above).
//
//   Mongo.result(CommandResult):
//     Converts the result of a JVM driver command to a JavaScript object.
//
// JSON API:
//
//   Note that the included JSON API performs especially well, because it works
//   directly with Rhino's native objects.
//
//   It also supported MongoDB's extended JSON: {$date:timestamp},
//   {$regex:'pattern',$options:'options'}, {$oid:'objectid'},
//   {$binary:'base64',$type:'hex'} and {$ref:'collection',$id:'objectid'}.
//
//   JSON.to(object, indent):
//     Generates human-readable indented, multiline JSON when indent (optional) is
//     true, otherwise generates compact JSON. Dates, regular expressions and MongoDB's
//     BSON types are all converted to the extended JSON format.
//
//   JSON.from(string, extendedJSON):
//     Converts a JSON string to native JavaScript. If extendedJSON (optional) is true,
//     also supports extended JSON format, converting to native JavaScript Date,
//     RegExp and BSON types as appropriate.
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

		writeConcern: function(writeConcern) {
			var type = typeof writeConcern
			if ((type == 'boolean') || (type == 'number')) {
				return new com.mongodb.WriteConcern(writeConcern)
			}
			else {
				var w = writeConcern.w
				var timeout = writeConcern.timeout
				var fsync = writeConcern.fsync
				if (fsync !== undefined) {
					return new com.mongodb.WriteConcern(w, timeout, fsync)
				}
				else {
					return new com.mongodb.WriteConcern(w, timeout)
				}
			}
		},
		
		result: function(result) {
			if (result) {
				return BSON.from(result.cachedLastError)
			}
			return null
		},
		
		MapReduceResult: function(result) {

			this.drop = function() {
				this.result.drop()
			}

			this.getOutputCollection = function() {
				return new Mongo.Collection(null, {collection: this.result.getOutputCollection()})
			}

			this.getCursor = function() {
				return new Mongo.Cursor(this.result.results())
			}
			
			// //////////////////////////////////////////////////////////////////////////
			// Private
			
			//
			// Construction
			//

			this.result = result
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
			
			this.count = function() {
				return this.cursor.count()
			}
			
			this.toArray = function() {
				var array = []
				var index = 0
				while (this.hasNext()) {
					var doc = this.next()
					array.push(doc)
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
			
			this.count = function(query) {
				if (query) {
					return this.collection.getCount(BSON.to(query))
				}
				else {
					return this.collection.getCount()
				}
			}
			
			this.save = function(doc, writeConcern) {
				if (writeConcern !== undefined) {
					return Mongo.result(this.collection.save(BSON.to(doc), Mongo.writeConcern(writeConcern)))
				}
				else {
					return Mongo.result(this.collection.save(BSON.to(doc)))
				}
			}
			
			this.insert = function(doc, writeConcern) {
				if (writeConcern !== undefined) {
					return Mongo.result(this.collection.insert(BSON.to(doc), Mongo.writeConcern(writeConcern)))
				}
				else {
					return Mongo.result(this.collection.insert(BSON.to(doc)))
				}
			}
			
			this.update = function(query, update, multi, writeConcern) {
				if (writeConcern !== undefined) {
					return Mongo.result(this.collection.update(BSON.to(query), BSON.to(update), false, multi == true, Mongo.writeConcern(writeConcern)))
				}
				else {
					return Mongo.result(this.collection.update(BSON.to(query), BSON.to(update), false, multi == true))
				}
			}
			
			this.upsert = function(query, update, multi, writeConcern) {
				if (writeConcern !== undefined) {
					return Mongo.result(this.collection.update(BSON.to(query), BSON.to(update), true, multi == true, Mongo.writeConcern(writeConcern)))
				}
				else {
					return Mongo.result(this.collection.update(BSON.to(query), BSON.to(update), true, multi == true))
				}
			}
			
			this.remove = function(query, writeConcern) {
				if (writeConcern !== undefined) {
					return Mongo.result(this.collection.remove(BSON.to(query), Mongo.writeConcern(writeConcern)))
				}
				else {
					return Mongo.result(this.collection.remove(BSON.to(query)))
				}
			}

			this.mapReduce = function(mapFn, reduceFn, query) {
				var result = this.collection.mapReduce(String(mapFn), String(reduceFn), null, BSON.to(query))
				return result ? new Mongo.MapReduceResult(result) : null
			}
			
			this.findAndModify = function(query, update) {
				return BSON.from(this.collection.findAndModify(BSON.to(query), BSON.to(update)))
			}
			
			this.findAndRemove = function(query) {
				return BSON.from(this.collection.findAndRemove(BSON.to(query)))
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
			
			this.insertNext = function(doc) {
				doc.id = this.nextID()
				return Mongo.result(this.collection.insert(BSON.to(doc)))
			}
			
			// //////////////////////////////////////////////////////////////////////////
			// Private
			
			//
			// Construction
			//
			
			config = config || {}
			this.connection = config.connection || Public.defaultConnection
			this.db = config.db || Public.defaultDB
			this.idsCollection = config.idsCollection || Public.defaultIdsCollection

			if (this.db instanceof String) {
				this.db = this.connection.getDB(this.db)
			}
			this.collection = config.collection || this.db.getCollection(name)
			
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
	
	Public.defaultConnection = application.globals.get('mongo.defaults.connection')
	if (!Public.defaultConnection) {
		var defaultServers = application.globals.get('mongo.defaultServers')
		if (defaultServers) {
			Public.defaultConnection = application.getGlobal('mongo.defaults.connection', Public.connect(defaultServers, {
				autoConnectRetry: true
			}))
		}
	}
	
	if (Public.defaultConnection) {
		Public.defaultDB = application.globals.get('mongo.defaults.db')
		if (!Public.defaultDB) {
			var defaultDB = application.globals.get('mongo.defaultDB')
			if (defaultDB) {
				Public.defaultDB = application.getGlobal('mongo.defaults.db', Public.defaultConnection.getDB(defaultDB))
			}
		}
		
		if (Public.defaultDB) {
			Public.defaultIdsCollection = application.globals.get('mongo.defaults.idsCollection')
			if (!Public.defaultIdsCollection) {
				var defaultIdsCollectionName = application.globals.get('mongo.defaultIdsCollectionName')
				if (defaultIdsCollectionName) {
					Public.defaultIdsCollection = application.getGlobal('mongo.defaults.idsCollection', new Public.Collection(defaultIdsCollectionName))
				}
			}
		}
	}
	
	return Public
}()
