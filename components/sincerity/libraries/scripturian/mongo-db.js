//
// MongoDB API for Prudence
//
// Copyright 2010-2013 Three Crickets LLC.
//
// The contents of this file are subject to the terms of one of the following
// open source licenses. You can select the license that you prefer but you may
// not use this file except in compliance with one of these licenses.
//
// The LGPL version 3.0:
// http://www.opensource.org/licenses/lgpl-3.0.html
//
// The Apache License version 2.0:
// http://www.opensource.org/licenses/apache2.0.php
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

/**
 * <a href="http://www.mongodb.org/">MongoDB site</a> API for <a
 * href="http://threecrickets.com/prudence/">Prudence</a>.
 * <p>
 * Uses the <a href="https://github.com/mongodb/mongo-java-driver">MongoDB Java
 * driver</a> and the <a href="http://code.google.com/p/mongodb-jvm/">MongoDB
 * JVM project</a>.
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.77
 */
var MongoDB = MongoDB || function() {
	/** @exports Public as MongoDB */
	var Public = {}

	/**
	 * The logger.
	 * 
	 * @field
	 * @returns {java.util.logging.Logger}
	 */
	Public.logger = (exists(application) && exists(application.getSubLogger)) ? application.getSubLogger('mongodb') : java.util.logging.Logger.getLogger('mongodb')

	/**
	 * @field
	 * @returns {com.mongodb.jvm.BSON}
	 */
	Public.BSON = com.mongodb.jvm.BSON
	
	/**
	 * Common MongoDB error codes
	 * 
	 * @namespace
	 */
	Public.Error = {
		/** @constant */
		Gone: -2,
		/** @constant */
		NotFound: -5,
		/** @constant */
		Capped: 10003,
		/** @constant */
		DuplicateKey: 11000,
		/** @constant */
		DuplicateKeyOnUpdate: 11001
	}
	
	/**
	 * Query options.
	 * 
	 * @namespace
	 * @see MongoDB.Cursor#addOption;
	 * @see MongoDB.Cursor#setOptions;
	 * @see MongoDB.Cursor#getOptions;
	 * @see See the <a
	 *      href="http://api.mongodb.org/java/current/index.html?com/mongodb/Bytes.html">Bytes
	 *      documentation (see QUERYOPTION_)</a>
	 */
	Public.QueryOption = {
		/** @constant */
		awaitData: com.mongodb.Bytes.QUERYOPTION_AWAITDATA,
		/** @constant */
		exhaust: com.mongodb.Bytes.QUERYOPTION_EXHAUST,
		/** @constant */
		noTimeout: com.mongodb.Bytes.QUERYOPTION_NOTIMEOUT,
		/** @constant */
		opLogReplay: com.mongodb.Bytes.QUERYOPTION_OPLOGREPLAY,
		/** @constant */
		partial: com.mongodb.Bytes.QUERYOPTION_PARTIAL,
		/** @constant */
		slaveOk: com.mongodb.Bytes.QUERYOPTION_SLAVEOK,
		/** @constant */
		tailable: com.mongodb.Bytes.QUERYOPTION_TAILABLE
	}
	
	/**
	 * Result flags.
	 * 
	 * @namespace
	 * @see See the <a
	 *      href="http://api.mongodb.org/java/current/index.html?com/mongodb/Bytes.html">Bytes
	 *      documentation (see RESULTFLAG_)</a>
	 */
	Public.ResultFlag = {
		/** @constant */
		awaitData: com.mongodb.Bytes.RESULTFLAG_AWAITCAPABLE,
		/** @constant */
		cursorNotFound: com.mongodb.Bytes.RESULTFLAG_CURSORNOTFOUND,
		/** @constant */
		errSet: com.mongodb.Bytes.RESULTFLAG_ERRSET,
		/** @constant */
		shardConfigStale: com.mongodb.Bytes.RESULTFLAG_SHARDCONFIGSTALE
	}
	
	/**
	 * Write concern constants.
	 * 
	 * @namespace
	 * @see MongoDB#writeConcern
	 */
	Public.WriteConcern = {
		/** @constant */
		acknowledged: com.mongodb.WriteConcern.ACKNOWLEDGED,
		/** @constant */
		errorsIgnored: com.mongodb.WriteConcern.ERRORS_IGNORED,
		/** @constant */
		fsyncSafe: com.mongodb.WriteConcern.FSYNC_SAFE,
		/** @constant */
		fsynced: com.mongodb.WriteConcern.FSYNCED,
		/** @constant */
		journalSafe: com.mongodb.WriteConcern.JOURNAL_SAFE,
		/** @constant */
		journaled: com.mongodb.WriteConcern.JOURNALED,
		/** @constant */
		majority: com.mongodb.WriteConcern.MAJORITY,
		/** @constant */
		none: com.mongodb.WriteConcern.NONE,
		/** @constant */
		normal: com.mongodb.WriteConcern.NORMAL,
		/** @constant */
		replicaAcknowledged: com.mongodb.WriteConcern.REPLICA_ACKNOWLEDGED,
		/** @constant */
		replicasSafe: com.mongodb.WriteConcern.REPLICAS_SAFE,
		/** @constant */
		safe: com.mongodb.WriteConcern.SAFE,
		/** @constant */
		unacknowledged: com.mongodb.WriteConcern.UNACKNOWLEDGED
	}

	/**
	 * Read preferences.
	 * 
	 * @namespace
	 * @see MongoDB#readPreference
	 */
	Public.ReadPreference = {
		/** @constant */
		primary: com.mongodb.ReadPreference.primary(),
		/** @constant */
		primaryPreferred: com.mongodb.ReadPreference.primaryPreferred(),
		/** @constant */
		secondary: com.mongodb.ReadPreference.secondary(),
		/** @constant */
		secondaryPreferred: com.mongodb.ReadPreference.secondaryPreferred(),
		/** @constant */
		nearest: com.mongodb.ReadPreference.nearest()
	}
	
	/**
	 * Defaults to the 'mongoDb.defaultClient' application global or shared
	 * application global. If those do not exist, uses the
	 * 'mongoDb.defaultServers' application global or shared application global
	 * to call {@link MongoDB#connect}. If that does not exist either, then
	 * tries to connect to localhost using the default port.
	 * 
	 * @field
	 * @returns {<a
	 *          href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 * @see MongoDB#connect
	 */
	Public.defaultClient = null

	/**
	 * Defaults to the 'mongoDb.defaultDb' application global or shared
	 * application global. Can be configured as the database name, or an object
	 * in the form of {name:'string', username:'string', password:'string'} for
	 * authenticated databases.
	 * 
	 * @field
	 * @returns {com.mongodb.DB}
	 * @see MongoDB#connect
	 */
	Public.defaultDb = null
	
	/**
	 * Defaults to the 'mongoDb.defaultSwallow' application global or shared
	 * application global.
	 * 
	 * @field
	 * @returns {Boolean} If true, do not throw exceptions
	 */
	Public.defaultSwallow = null
	
	/**
	 * Creates a MongoDB client instance, which internally handles thread
	 * pooling and collection resource management. It is unlikely that you would
	 * need more than one MongoDB client to the same set of MongoDB instances in
	 * the same JVM, thus it is recommended to store it in Prudence's
	 * application.sharedGlobals.
	 * 
	 * @param {String|String[]}
	 *            [uris='mongodb://localhost:27017'] A <a
	 *            href="http://docs.mongodb.org/manual/reference/connection-string/">MongoDB
	 *            connection string</a> or one or an array of server addresses
	 *            of the MongoDB instances to connect to. Server addresses are
	 *            in the form of "host" or "host:port". "host" can be an IP
	 *            address or domain name.
	 * @param [options]
	 *            Options are only used if you are not using a MongoDB
	 *            connection string for 'uris'
	 * @param {Boolean}
	 *            [options.alwaysUseMBeans] Sets whether JMX beans registered by
	 *            the driver should always be MBeans
	 * @param {Boolean}
	 *            [options.autoConnectRetry=true] True if failed connections are
	 *            retried
	 * @param {Number}
	 *            [options.connectionsPerHost] Pool size per URI
	 * @param {Number}
	 *            [options.connectTimeout] Milliseconds allowed for connection
	 *            to be made before an exception is thrown
	 * @param {Boolean}
	 *            [options.cursorFinalizerEnabled] Sets whether cursor
	 *            finalizers are enabled
	 * @param {String}
	 *            [options.description] A description of this connection (for
	 *            debugging)
	 * @param {Number}
	 *            [options.maxAutoConnectRetryTime] Milliseconds for the maximum
	 *            auto connect retry time
	 * @param {Number}
	 *            [options.maxWaitTime] Milliseconds allowed for a thread to
	 *            block before an exception is thrown
	 * @param {Boolean}
	 *            [options.socketKeepalive] Sets whether socket keep alive is
	 *            enabled
	 * @param {Number}
	 *            [options.socketTimeout] Milliseconds allowed for a socket
	 *            operation before an exception is thrown
	 * @param {Number}
	 *            [options.threadsAllowedToBlockForConnectionMultiplier]
	 *            Multiply this by connectionsPerHost to get the number of
	 *            threads allowed to block before an exception is thrown
	 * @param {Number}
	 *            [options.writeConcern=MongoDB.WriteConcern.acknowledged]
	 *            Default {@link MongoDB#writeConcern}
	 * @param {Number}
	 *            [options.readPreference] Default
	 *            {@link MongoDB#readPreference}
	 * @param {String}
	 *            [options.username] Optional username for authentication of
	 *            'admin' database
	 * @param {String}
	 *            [options.password] Optional password for authentication of
	 *            'admin' database
	 * @returns {<a
	 *          href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 */
	Public.connect = function(uris, options) {
		var mongoUri
		if (!exists(uris) || (uris.length == 0)) {
			uris = 'localhost:27017'
		}
		
		if (isArray(uris)) {
			var array = new java.util.ArrayList(uris.length)
			for (var u in uris) {
				array.add(new com.mongodb.ServerAddress(uris[u]))
			}
			uris = array
		}
		else {
			if (uris.substring(0, 8) == 'mongodb:') {
				mongoUri = new com.mongodb.MongoClientURI(uris)
			}
			else {
				uris = new com.mongodb.ServerAddress(uris)
			}
		}
		
		if (!exists(options)) {
			// Default options
			options = {
				autoConnectRetry: true
			}
		}
		
		var username
		if (exists(options.username)) {
			username = options.username
			delete options.username
		}
		
		var password
		if (exists(options.password)) {
			password = options.password
			delete options.password
		}
		
		var client
		if (exists(mongoUri)) {
			client = new com.mongodb.MongoClient(mongoUri)
		}
		else {
			if (!exists(options.writeConcern)) {
				// This is enforced since Java driver version 2.10.0, but
				// we want to make sure this is always true for consistency
				options.writeConcern = Public.WriteConcern.acknowledged
			}
			
			// Convert options to MongoClientOptions
			var builder = com.mongodb.MongoClientOptions.builder()
			for (var key in options) {
				var value = options[key]
				
				if (key == 'writeConcern') {
					value = Public.writeConcern(value)
				}
				else if (key == 'readPreference') {
					value = Public.readPreference(value)
				}
				else if (key == 'socketFactory') {
					// Handle special 'default' value
					if (isString(value) && (value == 'ssl')) {
						value = new javax.net.ssl.SSLSocketFactory.getDefault()
					}
				}
					
				builder = builder[key](value)
			}
			options = builder.build()
		
			client = new com.mongodb.MongoClient(uris, options)
		}
		
		if (exists(username) && exists(password)) {
			// Authenticate the 'admin' database
			Public.getDB(client, 'admin', username, password)
		}
		
		return client
	}
	
	/**
	 * Shortcut to call {@link MongoDB#connect} and
	 * {@link MongoDB#setDefaultClient}.
	 * 
	 * @param {String|String[]}
	 *            [uris] See {@link MongoDB#connect}
	 * @param {Object}
	 *            [options] See {@link MongoDB#connect}
	 * @returns {<a
	 *          href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 */
	Public.connectAndSetDefaultClient = function(uris, options) {
		var client = Public.connect(uris, options)
		Public.setDefaultClient(client)
		return client
	}

	/**
	 * Sets the default client.
	 * 
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 *            client
	 */
	Public.setDefaultClient = function(client) {
		Public.defaultClient = client
		application.globals.put('mongoDb.defaultClient', client)
	}

	/**
	 * Closes all MongoDB connections in the client's connection pool.
	 * Subsequent uses will open new connections and add them to the pool.
	 * <p>
	 * May be useful to solve memory leak problems with the MongoDB server that
	 * are associated with connections. Closing connections once in a while
	 * releases their heap memory on the server.
	 * 
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 *            [client=defaultClient]
	 */
	Public.closeConnections = function(client) {
		client = exists(client) ? client : Public.defaultClient
		var connector = connection.connector

		function close(address) {
			var pool = connector.getDBPortPool(address)
			for (var i = pool.all; i.hasNext(); ) {
				var port = i.next()
				pool.remove(port)
			}
		}

		var addresses = connector.allAddress
		if (exists(addresses)) {
			// For replica sets
			for (var i = addresses.iterator(); i.hasNext(); ) {
				var address = i.next()
				close(address)
			}
			Public.logger.info('Reset MongoDB connections for: ' + client)
		}
		else {
			// For single node
			var address = connector.address
			if (exists(address)) {
				close(address)
				Public.logger.info('Reset MongoDB connection for: ' + client)
			}
		}
	}
	
	/**
	 * Creates a new, universally unique MongoDB object ID.
	 * 
	 * @returns {<a
	 *          href="http://api.mongodb.org/java/current/index.html?org/bson/types/ObjectId.html">org.bson.types.ObjectId</a>}
	 *          A new ObjectId
	 */
	Public.newId = function() {
		return org.bson.types.ObjectId.get()
	}
	
	/**
	 * Converts a string representing a MongoDB object ID into an ObjectId
	 * instance.
	 * 
	 * @param {String}
	 *            id The object ID string
	 * @returns {<a
	 *          href="http://api.mongodb.org/java/current/index.html?org/bson/types/ObjectId.html">org.bson.types.ObjectId</a>}
	 *          An ObjectId or null if invalid
	 */
	Public.id = function(id) {
		try {
			return exists(id) ? new org.bson.types.ObjectId(String(id)) : null
		}
		catch (x) {
			// Not a properly formed id string
			return null
		}
	}

	/**
	 * Creates a MongoDB WriteConcern.
	 * 
	 * @param {Number|String|Boolean|Object}
	 *            writeConcern Numeric and string values are converted to 'w';
	 *            boolean values are converted to 'fsync'; otherwise provide a
	 *            dict in the form of {w:number|string, timeout:number,
	 *            fsync:boolean, j:boolean, continueOnInsertError:boolean}
	 * @returns {<a
	 *          href="http://api.mongodb.org/java/current/index.html?com/mongodb/WriteConcern.html">com.mongodb.WriteConcern</a>}
	 * @see See the <a
	 *      href="http://docs.mongodb.org/manual/core/write-concern/">MongoDB
	 *      Manual</a>
	 */
	Public.writeConcern = function(writeConcern) {
		if (writeConcern instanceof com.mongodb.WriteConcern) {
			return writeConcern
		}
		var type = typeof writeConcern
		if (isString(type) || (type == 'boolean') || (type == 'number')) {
			return new com.mongodb.WriteConcern(writeConcern)
		}
		else {
			var w = writeConcern.w
			var timeout = writeConcern.timeout
			var fsync = writeConcern.fsync
			var j = writeConcern.j
			var continueOnInsertError = writeConcern.continueOnInsertError

			if (undefined !== fsync) {
				if (undefined !== j) {
					if (undefined !== continueOnInsertError) {
						return new com.mongodb.WriteConcern(w, timeout, fsync, j, continueOnInsertError)
					}
					else {
						return new com.mongodb.WriteConcern(w, timeout, fsync, j)
					}
				}
				else {
					return new com.mongodb.WriteConcern(w, timeout, fsync)
				}
			}
			else {
				return new com.mongodb.WriteConcern(w, timeout)
			}
		}
	}
	
	/**
	 * Returns a MongoDB ReadPreference.
	 * 
	 * @param {String|Object}
	 *            readPreference Either a string, or a dict in the form of
	 *            {primayPreferred:...}, {secondary:...},
	 *            {secondaryPreferred:...}, {nearest:...}
	 */
	Public.readPreference = function(readPreference) {
		if (readPreference instanceof com.mongodb.ReadPreference) {
			return readPreference
		}
		if (isString(readPreference)) {
			return Public.ReadPreference[readPreference]
		}
		else if (exists(readPreference.primaryPreferred)) {
			var array = readPreference.primaryPreferred
			for (var a in array) {
				array[a] = Public.BSON.to(array[a])
			}
			return com.mongodb.ReadPreference.primaryPreferred.apply(null, array)
		}
		else if (exists(readPreference.secondary)) {
			var array = readPreference.secondary
			for (var a in array) {
				array[a] = Public.BSON.to(array[a])
			}
			return com.mongodb.ReadPreference.secondary.apply(null, array)
		}
		else if (exists(readPreference.secondaryPreferred)) {
			var array = readPreference.secondaryPreferred
			for (var a in array) {
				array[a] = Public.BSON.to(array[a])
			}
			return com.mongodb.ReadPreference.secondaryPreferred.apply(null, array)
		}
		else if (exists(readPreference.nearest)) {
			var array = readPreference.nearest
			for (var a in array) {
				array[a] = Public.BSON.to(array[a])
			}
			return com.mongodb.ReadPreference.nearest.apply(null, array)
		}
	}
	
	/**
	 * Extracts the CommandResult from a WriteResult. Exact values depend on the
	 * command:
	 * <ul>
	 * <li>ok: if the command was successful</li>
	 * <li>n: number of documents updated</li>
	 * <li>upserted: the ObjectId if upserted</li>
	 * </ul>
	 * 
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/WriteResult.html">com.mongodb.WriteResult</a>}
	 *            result The JVM result
	 */
	Public.result = function(result) {
		return exists(result) ? Public.BSON.from(result.cachedLastError) : null
	}
	
	/**
	 * @param {com.mongodb.AggregationOutput}
	 *            output
	 */
	Public.aggregationOutput = function(output) {
		if (exists(output)) {
			return {
				result: Public.BSON.from(output.commandResult),
				results: new function(iterator) {
					this.hasNext = function() {
						return this.iterator.hasNext()
					}
					
					this.next = function() {
						var doc = this.iterator.next()
						return MongoDB.BSON.from(doc)
					}
					
					this.iterator = iterator
				}(output.results().iterator())
			}
		}
		else {
			return null
		}
	}
	
	/**
	 * Converts the JVM exception to a JavaScript-friendly version.
	 * 
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoException.html">com.mongodb.MongoException</a>}
	 *            exception The MongoDB exception
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 *            client The MongoDB client
	 * @param {Boolean}
	 *            [swallow=false] If true, do not return exceptions
	 * @returns {Object} In the form of {code:number, message:'message'}
	 * @see MongoDB.Error
	 */
	Public.exception = function(exception, client, swallow) {
		if (exception instanceof com.mongodb.MongoException.Network) {
			if (Public.getLastStatus(client)) {
				Public.setLastStatus(client, false)
				Public.logger.severe('Down! ' + client)
			}
		}

		if (swallow) {
			if (!(exception instanceof com.mongodb.MongoException.Network)) {
				Public.logger.log(java.util.logging.Level.INFO, 'Swallowed exception', exception)
			}
			return null
		}

		return {code: exception.code, message: exception.message}
	}
	
	/**
	 * Gets a MongoDB database from a client, optionally authenticating it.
	 * 
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 *            client The MongoDB client
	 * @param {String}
	 *            name The database name
	 * @param {String}
	 *            [username] Optional username for authentication
	 * @param {String}
	 *            [password] Optional password for authentication
	 * @returns {<a
	 *          href="http://api.mongodb.org/java/current/index.html?com/mongodb/DB.html">com.mongodb.DB</a>}
	 */
	Public.getDB = function(client, name, username, password) {
		var db = client.getDB(name)
		if (exists(username) && exists(password) && exists(db)) {
			db.authenticate(username, new java.lang.String(password).toCharArray())
		}
		return db
	}
	
	/**
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 *            client The MongoDB client
	 * @returns {Boolean} True if MongoDB was last seen as up
	 */
	Public.getLastStatus = function(client) {
		var status = application.globals.get(String('mongoDb.status.' + client.hashCode())) // workaround to avoid ConsString in Nashorn
		if (exists(status)) {
			return status.booleanValue()
		}
		return true
	}

	/**
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 *            client The MongoDB client
	 * @param {Boolean}
	 *            status True if MongoDB was last seen as up
	 */
	Public.setLastStatus = function(client, status) {
		if (status && !Public.getLastStatus(client)) {
			Public.logger.info('Up! ' + client)
		}
		application.globals.put(String('mongoDb.status.' + client.hashCode()), status) // workaround to avoid ConsString in Nashorn
	}

	/**
	 * Removes all MongoDB settings from the application globals.
	 */
	Public.uninitialize = function() {
		removeGlobal('mongoDb.defaultClient')
		removeGlobal('mongoDb.defaultUris')
		removeGlobal('mongoDb.defaultOptions')
		removeGlobal('mongoDb.defaultServers')
		removeGlobal('mongoDb.defaultSwallow')
		removeGlobal('mongoDb.defaultDb')
	}
	
	/**
	 * Recursively "sanitizes" a JSON-compatible object by removing all "$"
	 * prefixes from keys.
	 * <p>
	 * Note that this changes the value in-place!
	 * 
	 * @param {Object}
	 *            value The object to sanitize
	 * @returns {Object} The sanitized object
	 */
	Public.sanitize = function(value) {
		if (isArray(value)) {
			for (var k in value) {
				Public.sanitize(value[k])
			}
		}
		else if (isDict(value)) {
			for (var k in value) {
				if (k[0] == '$') {
					var v = value[k]
					delete value[k]
					var n = k.substring(1)
					if (undefined === value[n]) {
						value[n] = v
					}
					Public.sanitize(value[n])
				}
				else {
					Public.sanitize(value[k])
				}
			}
		}
		return value
	}
	
	/**
	 * The results of a {@link MongoDB.Collection#mapReduce} command.
	 * 
	 * @class
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/MapReduceOutput.html">com.mongodb.MapReduceOutput</a>}
	 *            result The JVM map-reduce result
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 *            client The MongoDB client
	 * @param {Boolean}
	 *            [swallow=MongoDB.defaultSwallow] If true, do not throw
	 *            exceptions
	 */
	Public.MapReduceResult = function(result, client, swallow) {

		/**
		 * For non-inline mapReduce, returns the collection.
		 * 
		 * @returns {MongoDB.Collection}
		 */
		this.getOutputCollection = function() {
			try {
				var collection = this.result.outputCollection
				Public.setLastStatus(this.client, true)
				return exists(collection) ? new MongoDB.Collection(null, {collection: collection, swallow: this.swallow}) : null
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}

		/**
		 * For non-inline mapReduce, drops the collection.
		 * 
		 * @returns {MongoDB.MapReduceResult}
		 */
		this.drop = function() {
			try {
				var cursor = this.result.results()
				if (exists(cursor)) {
					try {
						// Make sure to close the cursor (if it is, indeed, a
						// cursor)
						cursor.close()
					}
					catch (x) {
					}
				}
				this.result.drop()
				Public.setLastStatus(this.client, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}

		/**
		 * For non-inline mapReduce, returns a cursor to the collection.
		 * 
		 * @returns {MongoDB.Cursor}
		 */
		this.getCursor = function() {
			try {
				// Note that the results might be an inline iterator: we are
				// assuming that the caller
				// knows that it is actually a cursor
				var cursor = this.result.results()
				Public.setLastStatus(this.client, true)
				return exists(cursor) ? new MongoDB.Cursor(cursor, this.swallow) : null
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		/**
		 * For inline mapReduce, returns the results.
		 * 
		 * @returns {Array}
		 */
		this.getInline = function() {
			try {
				var iterator = this.result.results()
				Public.setLastStatus(this.client, true)
				var r = []
				while (iterator.hasNext()) {
					r.push(Public.BSON.from(iterator.next()))
				}
				return r
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		//
		// Construction
		//

		this.result = result
		this.client = connection
		this.swallow = exists(swallow) ? swallow : Public.defaultSwallow
				
		// The following is a necessary workaround because the Java driver does
		// not properly deal with map reduce outputs
		// in a replica set (see https://jira.mongodb.org/browse/JAVA-364 and
		// http://groups.google.com/group/mongodb-user/browse_thread/thread/ff3d0a6a2b076473/6956b87bdc1bb63c)
		if (this.result.outputCollection) {
			this.result.outputCollection.options &= ~com.mongodb.Bytes.QUERYOPTION_SLAVEOK
		}
	}
	
	/**
	 * A MongoDB cursor. You usually do not have to create instances of this
	 * class directly, because they are returned by
	 * {@link MongoDB.Collection#find}. Note that you do not have to call
	 * {@link #close} if you are exhausting the cursor with calls to
	 * {@link #next}.
	 * 
	 * @class
	 * @param {
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/DBCursor.html">com.mongodb.DBCursor</a>}
	 *            cursor The JVM cursor
	 * @param {Boolean}
	 *            [swallow=MongoDB.defaultSwallow] If true, do not throw
	 *            exceptions
	 */
	Public.Cursor = function(cursor, swallow) {
		
		/**
		 * @returns {Boolean} True if there are more documents to iterate
		 * @see #next
		 */
		this.hasNext = function() {
			try {
				var hasNext = this.cursor.hasNext()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return hasNext
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return false
			}
		}
		
		/**
		 * Moves the cursor forward and gets the document.
		 * 
		 * @returns The next document
		 * @see #hasNext
		 */
		this.next = function() {
			try {
				var doc = this.cursor.next()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return Public.BSON.from(doc)
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		/**
		 * Gets the document without moving the cursor.
		 * 
		 * @returns The current document
		 */
		this.curr = function() {
			try {
				var doc = this.cursor.curr()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return Public.BSON.from(doc)
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		/**
		 * Moves the cursor forward without fetching documents.
		 * 
		 * @param {Number}
		 *            n The number of documents to skip
		 * @returns {MongoDB.Cursor} This cursor
		 */
		this.skip = function(n) {
			try {
				this.cursor.skip(n)
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Sets the maximum number of documents to iterate.
		 * 
		 * @param {Number}
		 *            n The limit
		 * @returns {MongoDB.Cursor} This cursor
		 */
		this.limit = function(n) {
			try {
				this.cursor.limit(n)
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Sets the iteration order.
		 * 
		 * @param orderBy
		 * @returns {MongoDB.Cursor} This cursor
		 */
		this.sort = function(orderBy) {
			try {
				this.cursor.sort(Public.BSON.to(orderBy))
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * The total number documents available for iteration.
		 * 
		 * @returns {Number} The number of documents
		 */
		this.count = function() {
			try {
				var count = this.cursor.count()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return count
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return -1
			}
		}
		
		/**
		 * The number documents iterated.
		 * 
		 * @returns {Number} The number of documents iterated
		 */
		this.numSeen = function() {
			try {
				var count = this.cursor.numSeen()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return count
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return -1
			}
		}

		/**
		 * Closes the cursor.
		 * 
		 * @returns {MongoDB.Cursor} This cursor
		 */
		this.close = function() {
			try {
				this.cursor.close()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Creates a copy of this cursor.
		 * 
		 * @returns {MongoDB.Cursor}
		 */
		this.copy = function() {
			try {
				var copy = this.cursor.copy()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return new Public.Cursor(copy)
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		/**
		 * Gets the cursor's functional and behavioral characteristics.
		 * 
		 * @returns The cursor's explanation
		 */
		this.explain = function() {
			try {
				var doc = this.cursor.explain()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return Public.BSON.from(doc)
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}

		/**
		 * @returns The keys wanted
		 */
		this.keysWanted = function() {
			try {
				return Public.BSON.from(this.cursor.keysWanted)
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		/**
		 * Makes sure that the list of iterated documents does not change.
		 * 
		 * @returns {MongoDB.Cursor} This cursor
		 */
		this.snapshot = function() {
			try {
				this.cursor.snapshot()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}

		/**
		 * Affect the cursor's functional characteristics.
		 * 
		 * @param {String|Object}
		 *            hint The hint
		 * @returns {MongoDB.Cursor} This cursor
		 */
		this.hint = function(hint) {
			try {
				if (typeof hint == 'string') {
					this.cursor.hint(hint)
				}
				else {
					this.cursor.hint(Public.BSON.to(hint))
				}
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Affect the cursor's functional characteristics.
		 * 
		 * @param {String}
		 *            name The special option name
		 * @param o
		 *            The value
		 * @returns {MongoDB.Cursor} This cursor
		 */
		this.addSpecial = function(name, o) {
			try {
				this.cursor.addSpecial(name, o)
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Fetches all remaining documents.
		 * 
		 * @returns {Array} The documents
		 */
		this.toArray = function() {
			var array = []
			while (this.hasNext()) {
				var doc = this.next()
				array.push(doc)
			}
			return array
		}
		
		// Options
		
		/**
		 * Removes all options.
		 * 
		 * @returns {MongoDB.Cursor} This cursor
		 */
		this.resetOptions = function() {
			try {
				this.cursor.resetOptions()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Gets the cursor's options.
		 * 
		 * @returns {String[]} The options
		 * @see MongoDB.QueryOption
		 */
		this.getOptions = function() {
			try {
				var options = []
				var bits = this.cursor.options
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				for (var o in Public.QueryOption) {
					var option = Public.QueryOption[o]
					if (bits & option) {
						options.push(o)
					}
				}
				return options
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Sets the cursor's options.
		 * 
		 * @param {String[]|Number}
		 *            options The options
		 * @returns {MongoDB.Cursor} This cursor
		 * @see MongoDB.QueryOption
		 */
		this.setOptions = function(options) {
			var bits = 0
			if (typeof options == 'number') {
				bits = options
			}
			else if (typeof options == 'object') {
				// Array of strings
				for (var o in options) {
					var option = Public.QueryOption[options[o]]
					if (option) {
						bits |= option
					}
				}
			}
			try {
				this.cursor.setOptions(bits)
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Adds a cursor option.
		 * 
		 * @param {String|Number}
		 *            option The option to add
		 * @returns {MongoDB.Cursor} This cursor
		 * @see MongoDB.QueryOption
		 */
		this.addOption = function(option) {
			var bits = 0
			if (typeof option == 'number') {
				bits = option
			}
			else if (typeof option == 'string') {
				option = Public.QueryOption[option]
				if (option) {
					bits = option
				}
			}
			try {
				this.cursor.addOption(bits)
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		// Batch
		
		/**
		 * Sets the batch size.
		 * 
		 * @param {Number}
		 *            size The number of documents per batch
		 * @returns {MongoDB.Cursor} This cursor
		 */
		this.batchSize = function(size) {
			try {
				this.cursor.batchSize(size)
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * @returns {Number} The number of documents available in this batch
		 */
		this.numGetMores = function() {
			try {
				var count = this.cursor.numGetMores()
				Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
				return count
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
				if (x) {
					throw x
				}
				return -1
			}
		}
		
		//
		// Construction
		//
		
		this.cursor = cursor
		this.swallow = exists(swallow) ? swallow : Public.defaultSwallow
	}
	
	/**
	 * A MongoDB collection. This is a lightweight wrapper that can be created
	 * as often as is needed. Resources per specific collection are managed
	 * centrally by the MongoDB connection, no matter how many of these wrappers
	 * are created per collection.
	 * 
	 * @class
	 * 
	 * @param {String}
	 *            name The collection name
	 * @param [config]
	 * @param {String|Object|
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/DB.html">com.mongodb.DB</a>}
	 *            [config.db=MongoDB.defaultDb] The MongoDB database to use, can
	 *            be its name, or an object in the form of {name:'string',
	 *            username:'string', password:'string'} for authenticated
	 *            connections
	 * @param {String|
	 *            <a
	 *            href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html">com.mongodb.MongoClient</a>}
	 *            [config.client=MongoDb.defaultClient] The MongoDB client
	 *            instance (see {@link MongoDB#connect})
	 * @param {String}
	 *            [config.uniqueId] If supplied, {@link #ensureIndex} will
	 *            automatically be called on the key
	 * @param {Boolean}
	 *            [config.swallow=MongoDB.defaultSwallow] If true, do not throw
	 *            exceptions
	 */
	Public.Collection = function(name, config) {
		
		/**
		 * Execute custom commands on the collection's DB.
		 * 
		 * @param command
		 * @returns {Object}
		 */
		this.command = function(command) {
			try {
				command = Public.BSON.to(command)
				var result = this.collection.getDB().command(command)
				Public.setLastStatus(this.client, true)
				return exists(result) ? Public.BSON.from(result).results : null
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}

		// Document retrieval
		
		/**
		 * Creates a cursor to iterate over one or more documents.
		 * 
		 * @param query
		 *            The query
		 * @param [fields]
		 *            The fields to fetch
		 * @returns {MongoDB.Cursor}
		 */
		this.find = function(query, fields) {
			try {
				var cursor
				query = query ? Public.BSON.to(query) : null
				fields = fields ? Public.BSON.to(fields) : null
				cursor = this.collection.find(query, fields)
				Public.setLastStatus(this.client, true)
				return new MongoDB.Cursor(cursor, this.swallow)
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		/**
		 * Fetches a single document, the first to match the query.
		 * 
		 * @param query
		 *            The query
		 * @param [fields]
		 *            The fields to fetch
		 * @param [options]
		 * @param [options.orderBy]
		 * @param [options.readPreference]
		 *            See {@link MongoDB#readPreference}
		 * @returns The document or null if not found
		 */
		this.findOne = function(query, fields, options) {
			try {
				var doc
				query = query ? Public.BSON.to(query) : null
				fields = fields ? Public.BSON.to(fields) : null
				options = options || {}
				var orderBy = options.orderBy ? Public.BSON.to(options.orderBy) : null
				var readPreference = options.readPreference ? Public.readPreference(options.readPreference) : null
				doc = this.collection.findOne(query, fields, orderBy, readPreference)
				Public.setLastStatus(this.client, true)
				return Public.BSON.from(doc)
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		/**
		 * Distance query (requires a 2D index).
		 * 
		 * @param options
		 * @param {Number[]}
		 *            options.near The 2D coordinates from which to measure
		 *            distance
		 * @param {Number}
		 *            [options.num] The maximum number of entries to return
		 * @param {Number}
		 *            [options.maxDistance] The maximum distance
		 * @param {Number}
		 *            [options.distanceMultiplier=1] Result distances are
		 *            multiplied by this (but options.maxDistance isn't!)
		 * @param {Boolean}
		 *            [options.spherical=false] True to use spherical model
		 * @param [options.query]
		 *            An option query to perform before the distance query
		 * @returns {Array} Each entry is in the form of {obj: ..., dis:
		 *          number}, and is sorted in ascending dis
		 */
		this.geoNear = function(options) {
			var command = {geoNear: this.collection.name}
			for (var k in options) {
				if (options.hasOwnProperty(k)) {
					command[k] = options[k]
				}
			}
			return this.command(command)
		}
		
		// Document modification
		
		/**
		 * Updates one or more documents.
		 * 
		 * @param query
		 *            The query
		 * @param update
		 *            The update
		 * @param [options]
		 *            Update options
		 * @param {Boolean}
		 *            [options.multi=false] True to update all documents, false
		 *            to update only the first document matching the query
		 * @param {Boolean}
		 *            [options.upsert=false] True to uspert (see {@link #upsert})
		 * @param [options.writeConcern]
		 *            See {@link MongoDB#writeConcern}
		 * @returns See {@link MongoDB#result}
		 * @see #upsert
		 */
		this.update = function(query, update, options) {
			// Compatibility with previous versions of API
			if (typeof options == 'boolean') {
				options = {multi: arguments[2], writeConcern: arguments[3]}
			}
			
			try {
				var result
				query = query ? Public.BSON.to(query) : null
				update = update ? Public.BSON.to(update) : null
				options = options || {}
				var multi = options.multi == true
				var upsert = options.upsert == true
				var writeConcern = exists(options.writeConcern) ? Public.writeConcern(options.writeConcern) : null
				result = exists(writeConcern) ? this.collection.update(query, update, upsert, multi, writeConcern) : this.collection.update(query, update, upsert, multi)
				Public.setLastStatus(this.client, true)
				return exists(result) ? Public.result(result) : null
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		// Document insertion
		
		/**
		 * Inserts a document, creating a default _id if not provided.
		 * 
		 * @param doc
		 *            The document to insert
		 * @param [writeConcern]
		 *            See {@link MongoDB#writeConcern}
		 * @returns See {@link MongoDB#result}
		 * @see #save
		 */
		this.insert = function(doc, writeConcern) {
			try {
				var result
				var bson = Public.BSON.to(doc)
				writeConcern = exists(writeConcern) ? Public.writeConcern(writeConcern) : null
				result = exists(writeConcern) ? this.collection.insert(bson, writeConcern) : this.collection.insert(bson)
				doc._id = bson.get('_id')
				Public.setLastStatus(this.client, true)
				return exists(result) ? Public.result(result) : null
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				if (x.javaException instanceof com.mongodb.MongoException.DuplicateKey) {
					throw MongoDB.exception(x.javaException, this.client, false)
				}
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}

		/**
		 * Like {@link #update}, but if no document is found works similary to
		 * {@link #insert}, creating a default _id if not provided.
		 * <p>
		 * Identical to calling {@link #update} with options.upsert=true.
		 * 
		 * @param query
		 *            The query
		 * @param update
		 *            The update
		 * @param [options]
		 *            See {@link #update}
		 * @returns See {@link MongoDB#result}
		 */
		this.upsert = function(query, update, options) {
			options = options || {}
			options.upsert = true
			return this.update(query, update, options)
		}

		/**
		 * Shortcut to {@link #upsert} a single document.
		 * 
		 * @param doc
		 *            The document to save
		 * @param [writeConcern]
		 *            See {@link MongoDB#writeConcern}
		 * @returns See {@link MongoDB#result}
		 * @see #upsert;
		 * @see #insert
		 */
		this.save = function(doc, writeConcern) {
			try {
				var result
				var bson = Public.BSON.to(doc)
				writeConcern = exists(writeConcern) ? Public.writeConcern(writeConcern) : null
				result = exists(writeConcern) ? this.collection.save(bson, writeConcern) : this.collection.save(bson) 
				doc._id = bson.get('_id')
				Public.setLastStatus(this.client, true)
				return exists(result) ? Public.result(result) : null
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				if (x.javaException instanceof com.mongodb.MongoException.DuplicateKey) {
					throw MongoDB.exception(x.javaException, this.client, false)
				}
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		// Combined modification and retrieval (a.k.a. "compare-and-set")
		
		/**
		 * Atomic find-and-modify on a single document.
		 * 
		 * @param query
		 *            The query
		 * @param update
		 *            The update
		 * @param [options]
		 *            Find-and-modify options
		 * @param [options.fields]
		 *            The fields to fetch
		 * @param [options.sort]
		 *            The sort to apply
		 * @param {Boolean}
		 *            [options.returnNew=false] True to return the modified
		 *            document
		 * @param {Boolean}
		 *            [options.upsert=false] True to insert if not found
		 * @param {Boolean}
		 *            [options.remove=false] True to remove the result (see
		 *            {@link #findAndRemove})
		 * @returns The document or null if not found (see options.returnNew
		 *          param)
		 */
		this.findAndModify = function(query, update, options) {
			try {
				var doc
				query = query ? Public.BSON.to(query) : null
				update = update ? Public.BSON.to(update) : null
				options = options || {}
				var fields = options.fields ? Public.BSON.to(options.fields) : null
				var sort = options.sort ? Public.BSON.to(options.sort) : null
				var remove = options.remove == true
				var returnNew = options.returnNew == true
				var upsert = options.upsert == true
				doc = this.collection.findAndModify(query, fields, sort, remove, update, returnNew, upsert)
				Public.setLastStatus(this.client, true)
				return Public.BSON.from(doc)
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				if (x.javaException.code == MongoDB.Error.NotFound) {
					// TODO?
					return null
				}
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		// Document removal
		
		/**
		 * Removes all documents matching the query.
		 * 
		 * @param query
		 *            The query
		 * @param [writeConcern]
		 *            See {@link MongoDB#writeConcern}
		 * @returns See {@link MongoDB#result}
		 * @see #findAndRemove
		 */
		this.remove = function(query, writeConcern) {
			try {
				var result
				query = query ? Public.BSON.to(query) : null
				writeConcern = exists(writeConcern) ? Public.writeConcern(writeConcern) : null
				result = exists(writeConcern) ? this.collection.remove(query, writeConcern) : this.collection.remove(query)
				Public.setLastStatus(this.client, true)
				return exists(result) ? Public.result(result) : null
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		/**
		 * Removes a single document and returns its last value.
		 * <p>
		 * Identical to calling {@link #findAndModify} with options.remove=true.
		 * 
		 * @param query
		 *            The query
		 * @para [options] See {@link #findAndModify}
		 * @returns The document or null if not found
		 * @see #remove
		 */
		this.findAndRemove = function(query, options) {
			options = options || {}
			options.remove = true
			return this.findAndModify(query, null, options)
		}
		
		/**
		 * Drops the collection. You should not call any more methods on the
		 * collection after calling this.
		 */
		this.drop = function() {
			try {
				this.collection.drop()
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
			}
		}
		
		// Aggregate queries
		
		/**
		 * Counts documents without fetching them.
		 * 
		 * @param [query]
		 *            The query or else count all documents
		 * @param [options]
		 * @param {Number}
		 *            [options.limit=0]
		 * @param {Number}
		 *            [options.skip=0]
		 * @param [options.readPreference]
		 *            See {@link MongoDB#readPreference}
		 * @returns {Number}
		 */
		this.count = function(query, options) {
			try {
				var count
				query = query ? Public.BSON.to(query) : null
				options = options || {}
				var limit = options.limit || 0
				var skip = options.skip || 0
				var readPreference = options.readPreference ? Public.readPreference(options.readPreference) : null
				count = this.collection.getCount(query, limit, skip, readPreference)
				Public.setLastStatus(this.client, true)
				return count
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return -1
			}
		}
		
		/**
		 * Finds all distinct values of key.
		 * 
		 * @param {String}
		 *            key
		 * @param [query]
		 *            The query or null
		 * @param [readPreference]
		 *            See {@link MongoDB#readPreference}
		 * @returns {Array}
		 */
		this.distinct = function(key, query, readPreference) {
			try {
				var list
				query = query ? Public.BSON.to(query) : null
				readPreference = readPreference ? Public.readPreference(readPreference) : null
				list = this.collection.distinct(key, query, readPreference)
				Public.setLastStatus(this.client, true)
				return Public.BSON.from(list)
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		/**
		 * General purpose aggregation.
		 * 
		 * @returns See {MongoDB#aggregationOutput}
		 */
		this.aggregate = function(/* array */) {
			try {
				var result
				var array = []
				for (var a in arguments) {
					array.push(Public.BSON.to(arguments[a]))
				}
				result = this.collection.aggregate.apply(this.collection, array)
				Public.setLastStatus(this.client, true)
				return exists(result) ? Public.aggregationOutput(result) : null
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		/**
		 * Grouping.
		 * 
		 * @param options
		 * @param {String}
		 *            options.key
		 * @param [options.condition]
		 * @param [options.initial]
		 * @param {Function|String}
		 *            [options.reduceFn]
		 * @param {Function|String}
		 *            [options.finalizeFn]
		 * @param [options.readPreference]
		 *            See {@link MongoDB#readPreference}
		 * @returns See {@link MongoDB#result}
		 */
		this.group = function(options) {
			try {
				var result
				options = options || {}
				var key = options.key || null
				var condition = options.condition ? Public.BSON.to(options.condition) : null
				var initial = options.initial ? Public.BSON.to(options.initial) : null
				var reduceFn = options.reduceFn ? String(options.reduceFn) : null
				var finalizeFn = options.finalizeFn ? String(options.finalizeFn) : null
				var readPreference = options.readPreference ? Public.readPreference(options.readPreference) : null
				result = this.collection.group(key, condition, initial, reduceFn, finalizeFn, readPreference)
				Public.setLastStatus(this.client, true)
				return exists(result) ? Public.result(result) : null
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}

		/**
		 * Map-reduce.
		 * 
		 * @param {Function|String}
		 *            mapFn The map function
		 * @param {Function|String}
		 *            reduceFn The reduce function
		 * @param [options]
		 *            Map-reduce options
		 * @param [options.query]
		 *            The query to apply before mapping
		 * @param {String|Object}
		 *            [options.out={inline:1}] If string, is interpreted as a
		 *            collection name to which results are simply added.
		 *            Otherwise:
		 *            <ul>
		 *            <li>{inline:1} for inline results (max size of single
		 *            MongoDB document); see
		 *            {@link MongoDB.MapReduceResults#getInline}</li>
		 *            <li>{merge:'collection name'} for merging results</li>
		 *            <li>{replace:'collection name'} for replacing results</li>
		 *            <li>{reduce:'collection name'} for calling reduce on
		 *            existing results</li>
		 *            </ul>
		 * @param [options.readPreference]
		 *            See {@link MongoDB#readPreference}
		 * @returns {MongoDB.MapReduceResult}
		 */
		this.mapReduce = function(mapFn, reduceFn, options) {
			try {
				var result
				options = options || {}
				var query = options.query ? Public.BSON.to(options.query) : null
				var readPreference = options.readPreference ? Public.readPreference(options.readPreference) : null
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
			
				result = this.collection.mapReduce(String(mapFn), String(reduceFn), out, outputType, query, readPreference)
				Public.setLastStatus(this.client, true)
				return exists(result) ? new MongoDB.MapReduceResult(result, this.client, this.swallow) : null
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}
		
		// Index management
		
		/**
		 * Information about all indexes on the collection.
		 * 
		 * @returns {Array}
		 */
		this.getIndexInfo = function() {
			try {
				var info = Public.BSON.from(this.collection.indexInfo)
				Public.setLastStatus(this.client, true)
				return Public.BSON.from(info)
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return null
			}
		}

		/**
		 * Creates an index if it does not exist.
		 * 
		 * @param index
		 *            The index to create
		 * @param [options]
		 *            Index options
		 * @returns {MongoDB.Collection}
		 */
		this.ensureIndex = function(index, options) {
			try {
				if (options) {
					this.collection.ensureIndex(Public.BSON.to(index), Public.BSON.to(options))
				}
				else {
					this.collection.ensureIndex(Public.BSON.to(index))
				}
				// Will not do any operation if the cached collection instance
				// thinks there is an index, so we cannot reliably assume the
				// connection is working:
				// Public.setLastStatus(this.client, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Removes an index.
		 * 
		 * @param {String|Object}
		 *            index The index name or descriptor
		 * @returns {MongoDB.Collection}
		 */
		this.dropIndex = function(index) {
			try {
				if (isString(index)) {
					this.collection.dropIndex(index)
				}
				else {
					this.collection.dropIndex(Public.BSON.to(index))
				}
				Public.setLastStatus(this.client, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		// Options
		
		/**
		 * Removes all options.
		 * 
		 * @returns {MongoDB.Collection} This collection
		 */
		this.resetOptions = function() {
			try {
				this.collection.resetOptions()
				Public.setLastStatus(this.client, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Gets the collection's options.
		 * 
		 * @returns {String[]} The options
		 * @see MongoDB.QueryOption
		 */
		this.getOptions = function() {
			try {
				var options = []
				var bits = this.collection.options
				Public.setLastStatus(this.client, true)
				for (var o in Public.QueryOption) {
					var option = Public.QueryOption[o]
					if (bits & option) {
						options.push(o)
					}
				}
				return options
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Sets the collection's options.
		 * 
		 * @param {String[]|Number}
		 *            options The options
		 * @returns {MongoDB.Collection} This collection
		 * @see MongoDB.QueryOption
		 */
		this.setOptions = function(options) {
			var bits = 0
			if (typeof options === 'number') {
				bits = options
			}
			else if (typeof options === 'object') {
				// Array of strings
				for (var o in options) {
					var option = Public.QueryOption[options[o]]
					if (option) {
						bits |= option
					}
				}
			}
			try {
				this.collection.setOptions(bits)
				Public.setLastStatus(this.client, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		/**
		 * Adds a collection option.
		 * 
		 * @param {String|Number}
		 *            option The option to add
		 * @returns {MongoDB.Collection} This collection
		 * @see MongoDB.QueryOption
		 */
		this.addOption = function(option) {
			var bits = 0
			if (typeof option === 'number') {
				bits = option
			}
			else if (typeof option === 'string') {
				option = Public.QueryOption[option]
				if (option) {
					bits = option
				}
			}
			try {
				this.collection.addOption(bits)
				Public.setLastStatus(this.client, true)
				return this
			}
			catch (x if x.javaException instanceof com.mongodb.MongoException) {
				x = MongoDB.exception(x.javaException, this.client, this.swallow)
				if (x) {
					throw x
				}
				return this
			}
		}
		
		//
		// Construction
		//
		
		config = config || {}
		this.swallow = exists(config.swallow) ? config.swallow : Public.defaultSwallow
		this.client = exists(config.client) ? config.client : Public.defaultClient
		this.db = exists(config.db) ? config.db : Public.defaultDb
				
		if (exists(this.db) && !(this.db instanceof com.mongodb.DB)) {
			if (isString(this.db)) {
				this.db = Public.getDB(this.client, this.db)
			}
			else {
				this.db = Public.getDB(this.client, this.db.name, config.username, config.password)
			}
		}

		this.collection = exists(config.collection) ? config.collection : (exists(this.db) ? this.db.getCollection(name) : null)
		
		if (config.uniqueId) {
			var index = {}
			index[config.uniqueId] = 1
			this.ensureIndex(index, {unique: true})
		}
	}
	
	//
	// Private
	//

	function exists(value) {
		// Note the order: we need the value on the right side for Rhino not to
		// complain about non-JS objects
		return (undefined !== value) && (null !== value)
	}
	
	function isString(value) {
		try {
			return (value instanceof String) || (typeof value === 'string')
		}
		catch (x) {
			return false
		}
	}
	
	function isArray(value) {
		return Object.prototype.toString.call(value) === '[object Array]'
	}
	
	function isDict(value) {
		return (typeof value === 'object') && !(value instanceof Date) && !(value instanceof RegExp) && !isArray(value)
	}
	
	function removeGlobal(name) {
		var fullName = String('mongoDb.' + name) // workaround to avoid ConsString in Nashorn
		application.globals.remove(fullName)
	}
	
	function getGlobal(name) {
		var fullName = String('mongoDb.' + name) // workaround to avoid ConsString in Nashorn
		var value = null
		try {
			value = app.globals.mongoDb[name]
		}
		catch (x) {}
		if (!exists(value)) {
			try {
				value = app.globals[fullName]
			}
			catch (x) {}
		}
		if (!exists(value)) {
			try {
				value = app.sharedGlobals.mongoDb[name]
			}
			catch (x) {}
		}
		if (!exists(value)) {
			try {
				value = app.sharedGlobals[fullName]
			}
			catch (x) {}
		}
		if (!exists(value)) {
			try {
				value = application.globals.get(fullName)
			}
			catch (x) {}
		}
		if (!exists(value)) {
			try {
				value = application.sharedGlobals.get(fullName)
			}
			catch (x) {}
		}
		if (!exists(value)) {
			try {
				value = component.context.attributes.get(fullName)
			}
			catch (x) {}
		}
		return value
	}
	
	//
	// Initialization
	//
	
	// Initialize default client
	Public.defaultClient = getGlobal('defaultClient')
	if (!exists(Public.defaultClient)) {
		var defaultUris = getGlobal('defaultUris')
		if (!exists(defaultUris)) {
			defaultUris = getGlobal('defaultServers') // legacy; depracated
		}
		if (exists(defaultUris)) {
			var defaultOptions = getGlobal('defaultOptions')
			Public.defaultClient = Public.connect(defaultUris, defaultOptions)
			try {
				// Prudence support
				Public.defaultClient = application.getGlobal('mongoDb.defaultClient', Public.defaultClient)
				app.globals.mongoDb = app.globals.mongoDb || {}
				app.globals.mongoDb.defaultClient = Public.defaultClient
			} catch(x) {}
		}
	}
	
	// Initialize default DB (only valid if there is a default client)
	if (exists(Public.defaultClient)) {
		Public.defaultDb = getGlobal('defaultDb')
		if (exists(Public.defaultDb) && !(Public.defaultDb instanceof com.mongodb.DB)) {
			if (isString(Public.defaultDb)) {
				Public.defaultDb = Public.getDB(Public.defaultClient, Public.defaultDb)
			}
			else {
				Public.defaultDb = Public.getDB(Public.defaultClient, Public.defaultDb.name, Public.defaultDb.username, Public.defaultDb.password)
			}
			try {
				// Prudence support
				Public.defaultDb = application.getGlobal('mongoDb.defaultDb', Public.defaultDb)
				app.globals.mongoDb = app.globals.mongoDb || {}
				app.globals.mongoDb.defaultDb = Public.defaultDb
			} catch(x) {}
		}
	}
	
	// Initialize default swallow mode
	Public.defaultSwallow = getGlobal('defaultSwallow')
	if (exists(Public.defaultSwallow) && Public.defaultSwallow.booleanValue) {
		Public.defaultSwallow = Public.defaultSwallow.booleanValue()
	}
	if (exists(Public.defaultSwallow)) {
		try {
			// Prudence support
			Public.defaultSwallow = application.getGlobal('mongoDb.defaultSwallow', Public.defaultSwallow)
			app.globals.mongoDb = app.globals.mongoDb || {}
			app.globals.mongoDb.defaultSwallow = Public.defaultSwallow
		} catch(x) {}
	}
	else {
		Public.defaultSwallow = false
	}
	
	// Support for extended JSON
	Public.BSON.enableExtendedJSON()
	
	return Public
}()
