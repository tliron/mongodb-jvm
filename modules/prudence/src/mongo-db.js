//
// MongoDB API for Prudence
//
// See the MongoDB Rhino project: http://code.google.com/p/mongodb-rhino/
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

importClass(com.mongodb.rhino.BSON, com.mongodb.rhino.JSON)

/**
 * MongoDB API for Prudence. Uses the MongoDB Java driver.
 * 
 * @namespace
 * @requires com.mongodb.jar
 * @see Visit the <a href="http://www.mongodb.org/">MongoDB site</a>
 * @see Visit the <a href="http://code.google.com/p/mongodb-rhino/">MongoDB Rhino project</a>
 * @see Visit the <a href="https://github.com/geir/mongo-java-driver">MongoDB Java driver</a> 
 * 
 * @author Tal Liron
 * @version 1.39
 */
var MongoDB = MongoDB || function() {
    var Public = /** @lends MongoDB */ {
	
		defaultConnection: null,
		defaultDb: null,
		
		/**
		 * Creates a MongoDB connection instance, which internally handles thread pooling
		 * and collection resource management. It is unlikely that you would need more than
		 * one MongoDB connection to the same set of MongoDB instances in the same JVM,
		 * thus it is recommended to store it in Prudence's application.sharedGlobals.
		 * 
		 * @param {String|String[]} [uris='localhost:27017']
		 *        A URI or array of URIs of the MongoDB instances to connect to.
		 *        URIs are in the form of "host" or "host:port". "host" can be an IP address or domain name.
		 *        When multiple URIs are used, the MongoDB connection is created in 'replica set' mode.
		 * @param [options]
		 * @param {Boolean} [options.autoConnectRetry] True if failed connections are retried
		 * @param {Number} [options.connectionsPerHost] Pool size per URI
		 * @param {Number} [options.connectTimeout] Milliseconds allowed for connection to be made before an exception is thrown
		 * @param {Boolean} [options.fsync] Default {@link MongoDB.WriteConcern} value
		 * @param {Number} [options.maxWaitTime] Milliseconds allowed for a thread to block before an exception is thrown
		 * @param {Boolean} [options.safe] True calls getLastError after every MongoDB command
		 * @param {Boolean} [options.slaveOk] True if allowed to read from slaves
		 * @param {Number} [options.socketTimeout] Milliseconds allowed for a socket operation before an exception is thrown
		 * @param {Number} [options.threadsAllowedToBlockForConnectionMultiplier] multiply this by connectionsPerHost to get the number
		 *        of threads allowed to block before an exception is thrown
		 * @param {Number} [options.w] Default {@link MongoDB.WriteConcern} value
		 * @param {Number} [options.wtimeout] Default {@link MongoDB.WriteConcern} value
		 * @returns {Mongo} See the <a href="http://api.mongodb.org/java/2.5/index.html?com/mongodb/Mongo.html">Mongo connection documentation</a>
		 */
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
		
		/**
		 * Creates a new, universally unique MongoDB object ID.
		 * 
		 * @returns {ObjectId} A a new ObjectId. 
		 *          See the <a href="http://api.mongodb.org/java/2.5/index.html?org/bson/types/ObjectId.html">ObjectId documentation</a>
		 */
		newId: function() {
			return org.bson.types.ObjectId.get()
		},
		
		/**
		 * Converts a string representing a MongoDB object ID into an ObjectId instance.
		 * 
		 * @returns {ObjectId} An ObjectId or null if invalid. 
		 *          See the <a href="http://api.mongodb.org/java/2.5/index.html?org/bson/types/ObjectId.html">ObjectId documentation</a>
		 */
		id: function(id) {
			try {
				return ((null !== id) && (undefined !== id)) ? new org.bson.types.ObjectId(id) : null
			}
			catch (x) {
				// Not a properly formed id
				return null
			}
		},

		/**
		 * Creates a MongoDB WriteConcern. Make sure that 'w' is at least 1 if you want to receive results.
		 * 
		 * @param {Number|Boolean|Object} writeConcern
		 *        Numeric values are converted to 'w';
		 *        boolean values are converted to 'fsync';
		 *        otherwise provide a dict in the form of {w:number, fsync:boolean, timeout:number} 
		 * @returns {WriteConcern} See the <a href="http://api.mongodb.org/java/2.5/index.html?com/mongodb/WriteConcern.html">WriteConcern documentation</a>
		 */
		writeConcern: function(writeConcern) {
			var type = typeof writeConcern
			if ((type == 'boolean') || (type == 'number')) {
				return new com.mongodb.WriteConcern(writeConcern)
			}
			else {
				var w = writeConcern.w
				var timeout = writeConcern.timeout
				var fsync = writeConcern.fsync
				if (undefined !== fsync) {
					return new com.mongodb.WriteConcern(w, timeout, fsync)
				}
				else {
					return new com.mongodb.WriteConcern(w, timeout)
				}
			}
		},
		
		/**
		 * Extracts the CommandResult from a WriteResult. Exact values depend on the command:
		 * <ul>
		 * <li>ok: if the command was successful</li>
		 * <li>n: number of documents updated</li>
		 * <li>upserted: the ObjectId if upserted</li>
		 * </ul>
		 * 
		 * @see Visit the <a href="http://api.mongodb.org/java/2.5/index.html?com/mongodb/CommandResult.html">CommandResult documentation</a>
		 * @see Visit the <a href="http://api.mongodb.org/java/2.5/index.html?com/mongodb/WriteResult.html">WriteResult documentation</a>
		 */
		result: function(result) {
			if (null !== result) {
				return BSON.from(result.cachedLastError)
			}
			return null
		},
		
		/**
		 * @returns {Object} In the form of {code:number, message:'message'}
		 * @see MongoDB.Error
		 */
		exception: function(exception) {
			return {code: exception.code, message: exception.message}
		},
		
		/**
		 * Common MongoDB error codes
		 */
		Error: {
			NotFound: -5,
			Capped: 10003,
			DuplicateKey: 11000,
			DuplicateKeyOnUpdate: 11001
		},
		
		/**
		 * The results of a {@link #mapReduce} command.
		 * 
		 * @class
		 * @see Visit the <a href="http://api.mongodb.org/java/2.5/index.html?com/mongodb/MapReduceOutput.html">MapReduceOutput documentation</a>
		 */
		MapReduceResult: function(result) {

			/**
			 * For non-inline mapReduce, returns the collection.
			 * 
			 * @returns {MongoDB.Collection}
			 */
			this.getOutputCollection = function() {
				var collection = this.result.outputCollection
				return null !== collection ? new MongoDB.Collection(null, {collection: collection}) : null
			}

			/**
			 * For non-inline mapReduce, drops the collection.
			 */
			this.drop = function() {
				this.result.drop()
			}

			/**
			 * For non-inline mapReduce, returns a cursor to the collection.
			 * 
			 * @returns {MongoDB.Cursor}
			 */
			this.getCursor = function() {
				var cursor = this.result.results()
				return null !== cursor ? new MongoDB.Cursor(cursor) : null
			}
			
			/**
			 * For inline mapReduce, returns the results.
			 */
			this.getInline = function() {
				return BSON.from(this.result.results())
			}
			
			// //////////////////////////////////////////////////////////////////////////
			// Private
			
			//
			// Construction
			//

			this.result = result
		},
		
		/**
		 * Cursor options.
		 * 
		 * @see MongoDB.Cursor#addOption
		 * @see MongoDB.Cursor#setOptions
		 * @see MongoDB.Cursor#getOptions
		 * @see Visit the <a href="http://api.mongodb.org/java/2.5/index.html?com/mongodb/Bytes.html">Bytes documentation (see QUERYOPTION_)</a>
		 */
		CursorOption: {
			awaitData: com.mongodb.Bytes.QUERYOPTION_AWAITDATA,
			exhaust: com.mongodb.Bytes.QUERYOPTION_EXHAUST,
			noTimeout: com.mongodb.Bytes.QUERYOPTION_NOTIMEOUT,
			slaveOk: com.mongodb.Bytes.QUERYOPTION_SLAVEOK,
			tailable: com.mongodb.Bytes.QUERYOPTION_TAILABLE
		},
		
		/**
		 * A MongoDB cursor. You usually do not have to create instances of this class
		 * directly, because they are returned by {@link MongoDB.Collection#find}. Note
		 * that you do not have to call {@link #close} if you are exhausting the cursor
		 * with calls to {@link #next}.
		 * 
		 * @class
		 */
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
			
			this.close = function() {
				this.cursor.close()
			}
			
			this.copy = function() {
				return new Public.Cursor(this.cursor.copy())
			}
			
			this.explain = function() {
				return BSON.from(this.cursor.explain())
			}

			this.keysWanted = function() {
				return BSON.from(this.cursor.keysWanted)
			}
			
			this.snapshot = function() {
				this.cursor.snapshot()
				return this
			}

			this.hint = function(hint) {
				if (typeof hint == 'string') {
					this.cursor.hint(hint)
				}
				else {
					this.cursor.hint(BSON.to(hint))
				}
				return this
			}
			
			this.addSpecial = function(name, o) {
				this.cursor.addSpecial(name, o)
				return this
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
			
			// Options
			
			this.resetOptions = function() {
				this.cursor.resetOptions()
				return this
			}
			
			/**
			 * @returns {String[]}
			 * @see MongoDB.CursorOption
			 */
			this.getOptions = function() {
				var options = []
				var bits = this.cursor.options
				for (var o in Public.CursorOption) {
					var option = Public.CursorOption[o]
					if (bits & option) {
						options.push(o)
					}
				}
				return options
			}
			
			/**
			 * @param {String[]|Number} options
			 * @see MongoDB.CursorOption
			 */
			this.setOptions = function(options) {
				var bits = 0
				if (typeof options == 'number') {
					bits = options
				}
				else if (typeof options == 'object') {
					// Array of strings
					for (var o in options) {
						var option = Public.CursorOption[options[o]]
						if (option) {
							bits |= option
						}
					}
				}
				this.cursor.setOptions(bits)
				return this
			}
			
			/**
			 * @param {String|Number} options
			 * @see MongoDB.CursorOption
			 */
			this.addOption = function(option) {
				var bits = 0
				if (typeof option == 'number') {
					bits = option
				}
				else if (typeof option == 'string') {
					option = Public.CursorOption[option]
					if (option) {
						bits = option
					}
				}
				this.cursor.addOption(bits)
				return this
			}
			
			// Batch
			
			this.batchSize = function(size) {
				this.cursor.batchSize(size)
				return this
			}
			
			/**
			 * @returns {Number} 
			 */
			this.numSeen = function() {
				return this.cursor.numSeen()
			}

			/**
			 * @returns {Number} 
			 */
			this.numGetMores = function() {
				return this.cursor.numGetMores()
			}
			
			//
			// Construction
			//
			
			this.cursor = cursor
		},
		
		/**
		 * A MongoDB collection. This is a lightweight wrapper that can be created as often as is needed.
		 * Resources per specific collection are managed centrally by the MongoDB connection, no
		 * matter how many of these wrappers are created per collection.
		 * 
		 * @class
		 * 
		 * @param {String} name The collection name
		 * @param [config]
		 * @param {String|DB} [config.db]
		 *        The name of the MongoDB or an instance of the database object. If not supplied,
		 *        uses the 'mongo.defaultDb' application global.
		 * @param {String|Mongo} [config.connection]
		 *        A MongoDB connection instance created by {@link MongoDB.connect}. If not
		 *        supplied, uses the default connection instance as defined by the
		 *        'mongo.defaultServers' application global. If 'mongo.defaultServers'
		 *        is also not supplied, localhost will be used at the default port.
		 * @param {String} [config.uniqueId]
		 *        If supplied, ensureIndex will automatically be called on the key. 
		 */
		Collection: function(name, config) {

			/**
			 * @param [options]
			 */
			this.ensureIndex = function(index, options) {
				try {
					this.collection.ensureIndex(BSON.to(index), BSON.to(options))
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					throw MongoDB.exception(x.javaException)
				}
				return this
			}
			
			/**
			 * @param [fields]
			 * @returns {MongoDB.Cursor}
			 */
			this.find = function(query, fields) {
				if (query) {
					if (undefined !== fields) {
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
			
			/**
			 * @param [fields]
			 */
			this.findOne = function(query, fields) {
				if (undefined !== fields) {
					return BSON.from(this.collection.findOne(BSON.to(query), BSON.to(fields)))
				}
				else {
					return BSON.from(this.collection.findOne(BSON.to(query)))
				}
			}
			
			/**
			 * @returns {Number}
			 */
			this.count = function(query) {
				if (query) {
					return this.collection.getCount(BSON.to(query))
				}
				else {
					return this.collection.getCount()
				}
			}
			
			/**
			 * @param [writeConcern] See {@link MongoDB.writeConcern}
			 * @returns See {@link MongoDB.result}
			 */
			this.save = function(doc, writeConcern) {
				try {
					if (undefined !== writeConcern) {
						return MongoDB.result(this.collection.save(BSON.to(doc), MongoDB.writeConcern(writeConcern)))
					}
					else {
						return MongoDB.result(this.collection.save(BSON.to(doc)))
					}
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException.DuplicateKey) {
					throw MongoDB.exception(x.javaException)
				}
			}
			
			/**
			 * @param [writeConcern] See {@link MongoDB.writeConcern}
			 * @returns See {@link MongoDB.result}
			 */
			this.insert = function(doc, writeConcern) {
				try {
					if (undefined !== writeConcern) {
						return MongoDB.result(this.collection.insert(BSON.to(doc), MongoDB.writeConcern(writeConcern)))
					}
					else {
						return MongoDB.result(this.collection.insert(BSON.to(doc)))
					}
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					if (x.javaException instanceof com.mongodb.MongoException.DuplicateKey) {
						// TODO?
					}
					throw MongoDB.exception(x.javaException)
				}
				return this
			}

			/**
			 * @param {Boolean} [multi=false] True to update more than one document
			 * @param [writeConcern] See {@link MongoDB.writeConcern}
			 * @returns See {@link MongoDB.result}
			 */
			this.update = function(query, update, multi, writeConcern) {
				try {
					if (undefined !== writeConcern) {
						return MongoDB.result(this.collection.update(BSON.to(query), BSON.to(update), false, multi == true, MongoDB.writeConcern(writeConcern)))
					}
					else {
						return MongoDB.result(this.collection.update(BSON.to(query), BSON.to(update), false, multi == true))
					}
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					throw MongoDB.exception(x.javaException)
				}
			}
			
			/**
			 * @param {Boolean} [multi=false] True to update more than one document
			 * @param [writeConcern] See {@link MongoDB.writeConcern}
			 * @returns See {@link MongoDB.result}
			 */
			this.upsert = function(query, update, multi, writeConcern) {
				try {
					if (undefined !== writeConcern) {
						return MongoDB.result(this.collection.update(BSON.to(query), BSON.to(update), true, multi == true, MongoDB.writeConcern(writeConcern)))
					}
					else {
						return MongoDB.result(this.collection.update(BSON.to(query), BSON.to(update), true, multi == true))
					}
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					throw MongoDB.exception(x.javaException)
				}
			}
			
			/**
			 * @param [writeConcern] See {@link MongoDB.writeConcern}
			 * @returns See {@link MongoDB.result}
			 */
			this.remove = function(query, writeConcern) {
				try {
					if (undefined !== writeConcern) {
						return MongoDB.result(this.collection.remove(BSON.to(query), MongoDB.writeConcern(writeConcern)))
					}
					else {
						return MongoDB.result(this.collection.remove(BSON.to(query)))
					}
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					throw MongoDB.exception(x.javaException)
				}
			}
			
			/**
			 * @param {Function|String} mapFn
			 * @param {Function|String} reduceFn
			 * @param [options]
			 * @param [options.query] The query to apply before mapping
			 * @param {String|Object} [options.out={inline:1}]
			 *        If string, is interpreted as a collection name to which results are simply added. Otherwise:
			 *        <ul>
			 *        <li>{inline:1} for inline results (max size of single MongoDB document); see {@link MongoDB.MapReduceResults#getInline}</li>
			 *        <li>{merge:'collection name'} for merging results</li>
			 *        <li>{replace:'collection name'} for replacing results</li>
			 *        <li>{reduce:'collection name'} for calling reduce on existing results</li>
			 *        </ul>
			 * @returns {MongoDB.MapReduceResult}
			 */
			this.mapReduce = function(mapFn, reduceFn, options) {
				options = options || {}
				var query = options.query || {}
				var outputType = null
				var out = options.out || {inline: 1}
				
				if (typeof out == 'object') {
					if (out.merge) {
						out = out.merge
						outputType = com.mongodb.MapReduceCommand.OutputType.MERGE
					}
					else {
						if (out.reduce) {
							out = out.reduce
							outputType = com.mongodb.MapReduceCommand.OutputType.REDUCE
						}
						else {
							if (out.replace) {
								out = out.replace
								outputType = com.mongodb.MapReduceCommand.OutputType.REPLACE
							}
							else {
								if (out.inline) {
									out = null
									outputType = com.mongodb.MapReduceCommand.OutputType.INLINE
								}
							}
						}
					}
				}
				
				var result
				try {
					if (null === outputType) {
						result = this.collection.mapReduce(String(mapFn), String(reduceFn), out, BSON.to(query))
					}
					else {
						result = this.collection.mapReduce(String(mapFn), String(reduceFn), out, outputType, BSON.to(query))
					}
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					throw MongoDB.exception(x.javaException)
				}
				
				
				return result ? new MongoDB.MapReduceResult(result) : null
			}
			
			/**
			 * @param [options]
			 * @param [options.fields]
			 * @param [options.sort]
			 * @param {Boolean} [options.returnNew=false]
			 * @param {Boolean} [options.upsert=false]
			 */
			this.findAndModify = function(query, update, options) {
				try {
					if (undefined !== options) {
						return BSON.from(this.collection.findAndModify(BSON.to(query), options.fields ? BSON.to(options.fields) : null, options.sort ? BSON.to(options.sort) : null, false, BSON.to(update), options.returnNew || false, options.upsert || false))
					}
					else {
						return BSON.from(this.collection.findAndModify(BSON.to(query), BSON.to(update)))
					}
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					if (x.javaException.code == MongoDB.Error.NotFound) {
						// "No matching object found"
						return null
					}
					throw MongoDB.exception(x.javaException)
				}
			}
			
			this.findAndRemove = function(query) {
				try {
					return BSON.from(this.collection.findAndRemove(BSON.to(query)))
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					if (x.javaException.code == MongoDB.Error.NotFound) {
						// "No matching object found"
						return null
					}
					throw MongoDB.exception(x.javaException)
				}
			}
			
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
	
	//
	// Private
    //

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
