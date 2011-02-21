//
// MongoDB API for Prudence
// Version 1.28
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
// MongoDB.Collection:
//
//   constructor(name, config):
//
//     The following optional config specs are supported:
//
//     db:
//       The name of the MongoDB or an instance of the database object. If not supplied,
//       uses the 'mongo.defaultDb' application global.
//
//     connection:
//       A MongoDB connection instance created by MongoDB.connect (see below). If not
//       supplied, uses the default connection instance as defined by the
//       'mongo.defaultServers' application global. If 'mongo.defaultServers'
//       is also not supplied, localhost will be used at the default port.
//
//     uniqueID:  
//       If supplied, ensureIndex will automatically be called on the key. 
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
//     insertNext(doc):
//       As insert(doc), except that an "id" key is added with a call to nextID(). 
//
//     find(query, fields):
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
//   MongoDB.connect(uris, options):
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
//     You can pass these DB instances as the DB config spec in the MongoDB.Collection
//     constructor. The same instance will be reused over multiple calls to
//     connection.getDB().
//
//   MongoDB.newId():
//     Creates a unique MongoDB ObjectId.
//
//   MongoDB.id(string):
//     Turns a correctly formatted string into a MongoDB ObjectId instance. Note
//     that the reverse is achieved via the regular JavaScript String(id) casting.
//
//   MongoDB.writeConcern(object):
//     Creates a write result (see collection's update(), above).
//
//   MongoDB.result(CommandResult):
//     Converts the result of a JVM driver command to a JavaScript object.
//
// JSON API:
//
//   Note that the included JSON API performs especially well, because it works
//   directly with Rhino's native objects.
//
//   It also supports MongoDB's extended JSON: {$date:timestamp},
//   {$regex:'pattern',$options:'options'}, {$oid:'objectid'},
//   {$binary:'base64',$type:'hex'} and {$ref:'collection',$id:'objectid'}.
//   We've also added another extended JSON notation: {$long:'integer'} for
//   numbers that would lose precision if converted in JavaScript numbers
//   (which are always double floats).
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

var MongoDB = MongoDB || function() {

	var Public = {
	
		defaultConnection: null,
		defaultDb: null,
		
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
		
		newId: function() {
			return org.bson.types.ObjectId.get()
		},
		
		id: function(id) {
			try {
				return id ? new org.bson.types.ObjectId(id) : null
			}
			catch (x) {
				// Not a properly formed id
				return id
			}
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
			if (result !== null) {
				return BSON.from(result.cachedLastError)
			}
			return null
		},
		
		MapReduceResult: function(result) {

			this.drop = function() {
				this.result.drop()
			}

			this.getOutputCollection = function() {
				return new MongoDB.Collection(null, {collection: this.result.getOutputCollection()})
			}

			this.getCursor = function() {
				return new MongoDB.Cursor(this.result.results())
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
			
			this.find = function(query, fields) {
				if (query) {
					if (fields !== undefined) {
						return new MongoDB.Cursor(this.collection.find(BSON.to(query), BSON.to(fields)))
					}
					else {
						return new MongoDB.Cursor(this.collection.find(BSON.to(query)))
					}
				}
				else {
					return new MongoDB.Cursor(this.collection.find())
				}
			}
			
			this.findOne = function(query, fields) {
				if (fields !== undefined) {
					return BSON.from(this.collection.findOne(BSON.to(query), BSON.to(fields)))
				}
				else {
					return BSON.from(this.collection.findOne(BSON.to(query)))
				}
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
					return MongoDB.result(this.collection.save(BSON.to(doc), MongoDB.writeConcern(writeConcern)))
				}
				else {
					return MongoDB.result(this.collection.save(BSON.to(doc)))
				}
			}
			
			this.insert = function(doc, writeConcern) {
				if (writeConcern !== undefined) {
					return MongoDB.result(this.collection.insert(BSON.to(doc), MongoDB.writeConcern(writeConcern)))
				}
				else {
					return MongoDB.result(this.collection.insert(BSON.to(doc)))
				}
			}
			
			this.update = function(query, update, multi, writeConcern) {
				if (writeConcern !== undefined) {
					return MongoDB.result(this.collection.update(BSON.to(query), BSON.to(update), false, multi == true, MongoDB.writeConcern(writeConcern)))
				}
				else {
					return MongoDB.result(this.collection.update(BSON.to(query), BSON.to(update), false, multi == true))
				}
			}
			
			this.upsert = function(query, update, multi, writeConcern) {
				if (writeConcern !== undefined) {
					return MongoDB.result(this.collection.update(BSON.to(query), BSON.to(update), true, multi == true, MongoDB.writeConcern(writeConcern)))
				}
				else {
					return MongoDB.result(this.collection.update(BSON.to(query), BSON.to(update), true, multi == true))
				}
			}
			
			this.remove = function(query, writeConcern) {
				if (writeConcern !== undefined) {
					return MongoDB.result(this.collection.remove(BSON.to(query), MongoDB.writeConcern(writeConcern)))
				}
				else {
					return MongoDB.result(this.collection.remove(BSON.to(query)))
				}
			}

			this.mapReduce = function(mapFn, reduceFn, query) {
				var result = this.collection.mapReduce(String(mapFn), String(reduceFn), null, BSON.to(query))
				return result ? new MongoDB.MapReduceResult(result) : null
			}
			
			this.findAndModify = function(query, update) {
				return BSON.from(this.collection.findAndModify(BSON.to(query), BSON.to(update)))
			}
			
			this.findAndRemove = function(query) {
				return BSON.from(this.collection.findAndRemove(BSON.to(query)))
			}
			
			this.insertNext = function(doc) {
				doc.id = this.nextID()
				return MongoDB.result(this.collection.insert(BSON.to(doc)))
			}
			
			// //////////////////////////////////////////////////////////////////////////
			// Private
			
			//
			// Construction
			//
			
			config = config || {}
			this.connection = exists(config.connection) ? config.connection : Public.defaultConnection
			this.db = exists(config.db) ? config.db : Public.defaultDb

			if (isString(this.db)) {
				this.db = this.connection.getDB(this.db)
			}

			this.collection = exists(config.collection) ? config.collection : this.db.getCollection(name)
			
			if (config.uniqueId) {
				var index = {}
				index[config.uniqueId] = 1
				this.ensureIndex(index, {unique: true})
			}
		}
	}
	
	// //////////////////////////////////////////////////////////////////////////
	// Private

	function exists(value) {
		// Note the order: we need the value on the right side for Rhino not to complain about non-JS objects
		return (undefined !== value) && (null !== value)
	}
	
	function isString(value) {
		try {
			return (typeof value == 'string') || (value instanceof String)
		}
		catch (x) {
			return false
		}
	}
	
	//
	// Construction
	//
	
	// Initialize default connection from globals or shared globals
	Public.defaultConnection = application.globals.get('mongoDb.defaultConnection')
	if (Public.defaultConnection === null) {
		if (exists(application.sharedGlobals)) {
			Public.defaultConnection = application.sharedGlobals.get('mongoDb.defaultConnection')
		}
		
		if (Public.defaultConnection === null) {
			var defaultServers = application.globals.get('mongoDb.defaultServers')
			if (defaultServers !== null) {
				Public.defaultConnection = application.getGlobal('mongoDb.defaultConnection', Public.connect(defaultServers, {autoConnectRetry: true}))
			}
		}
	}
	
	if (Public.defaultConnection !== null) {
		// Initialize default DB from globals
		Public.defaultDb = application.globals.get('mongoDb.defaultDb')
		if (Public.defaultDb !== null) {
			if (isString(Public.defaultDb)) {
				Public.defaultDb = application.getGlobal('mongoDb.defaultDb', Public.defaultConnection.getDB(Public.defaultDb))
			}
		}
	}
	
	return Public
}()
