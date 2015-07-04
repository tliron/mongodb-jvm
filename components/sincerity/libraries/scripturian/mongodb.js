//
// MongoDB API for Nashorn/Rhino in Scripturian
//
// Copyright 2010-2015 Three Crickets LLC.
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

if (!MongoClient) {

/**
 * A single client instance manages a pool of connections to a MongoDB sever or cluster.
 * All {@link MongoDatabase}, {@link MongoConnection}, and {@link MongoCursor} instances
 * derived from the client will use its shared pool of connections.
 * <p>
 * The connection pool is created when the instance is constructed, and exists until
 * {@link MongoClient#close} is called.
 * <p>
 * See the {@link MongoClient#connect} static method for an explanation of constructor
 * arguments. Note that there is no difference between constructing instances directly
 * using the 'new' keyword or calling {@link MongoClient#connect}. Both options are
 * supported.
 * <p>
 * The client's readPreference and writeConcern are used as default values for
 * operations in {@link MongoDatabase} and {@link MongoCollection}. As with other
 * options, you cannot change these defaults after the client has been created, but
 * you can use the withReadPreference and withWriteConcern methods in
 * {@link MongoDatabase} and {@link MongoCollection} to change their default values.
 * 
 * http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClient.html
 *
 * @class
 * @param [uri]
 * @param [options]
 */
var MongoClient = function(uri, options) {

	var connection
	if (uri instanceof com.mongodb.MongoClient) {
		// Just wrap
		connection = {
			client: uri
		}
	}
	else {
		// Connect
		connection = MongoUtil.connectClient(uri, options)
	}

	/** @field */
	this.client = connection.client
	
	/** @field */
	this.uri = connection.uri 
	
	/** @field */
	this.description = this.client.mongoClientOptions.description
	
	/** @field */
	this.collectionsToProperties = false
	
	/**
	 * @returns {<a href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClientOptions.html">com.mongodb.MongoClientOptions</a>}
	 */
	this.options = function() {
		try {
			return this.client.mongoClientOptions
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	//
	// Behavior
	//

	this.readPreference = function() {
		try {
			return this.client.mongoClientOptions.readPreference
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.writeConcern = function() {
		try {
			return this.client.mongoClientOptions.writeConcern
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	//
	// Operations
	//
	
	this.close = function() {
		try {
			this.client.close()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	//
	// Databases and collections
	//

	/**
	 * Direct access to a database.
	 * <p>
	 * The database will inherit the readPreference and writeConcern for its operations
	 * from this client, but these defaults can be changed by calling
	 * {@link MongoDatabase#withReadPreference} and {@link MongoDatabase#withWriteConcern}.
	 * 
	 * @returns {MongoDatabase}
	 */
	this.database = this.db = function(name) {
		try {
			return new MongoDatabase(this.client.getDatabase(name), this)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	/**
	 * Direct access to a collection.
	 * <p>
	 * The collection will inherit the readPreference and writeConcern for its operations
	 * from this client, but these defaults can be changed by calling
	 * {@link MongoCollection#withReadPreference} and {@link MongoCollection#withWriteConcern}.
	 * 
	 * @param {String|com.mongodb.MongoNamespace) fullName
	 *  The full name of the collection. For example, the collection 'mycollection'
	 *  in database 'mydatabase' would be 'mydatabase.mycollection' 
	 * @returns {MongoCollection}
	 */
	this.collection = function(fullName) {
		try {
			if (!(fullName instanceof com.mongodb.MongoNamespace)) {
				fullName = new com.mongodb.MongoNamespace(fullName)
			}
			var database = this.database(fullName.databaseName)
			return database.collection(fullName.collectionName)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 * @returns {MongoDatabase[]}
	 */
	this.databases = function(options) {
		try {
			var databases = []
			var i = this.client.listDatabaseNames().iterator()
			try {
				if (MongoUtil.exists(options)) {
					MongoUtil.mongoIterable(i, options)
				}
				while (i.hasNext()) {
					databases.push(this.database(i.next()))
				}
			}
			finally {
				i.close()
			}
			return databases
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 * @returns {String[]}
	 */
	this.databaseNames = function(options) {
		try {
			var databaseNames = []
			var i = this.client.listDatabaseNames().iterator()
			try {
				if (MongoUtil.exists(options)) {
					MongoUtil.mongoIterable(i, options)
				}
				while (i.hasNext()) {
					databaseNames.push(i.next())
				}
			}
			finally {
				i.close()
			}
			return databaseNames
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	// Try to access the admin database
	
	this.admin
	try {
		this.admin = this.database('admin')
	}
	catch (x) {}
}

/**
 * Creates a {@link MongoClient} instance.
 * 
 * @param {String|com.mongodb.MongoClientURI} [uri='mongodb://localhost/']
 * @param {Object|com.mongodb.MongoClientOptions.Builder} [options]
 * @param {String} [options.description]
 *  A description of this connection (useful for debugging)
 * @param {Object} [options.readPreference]
 * @param {String} [options.readPreference.mode='primary'] 
 *  <ul>
 *   <li>'primary': read only from the primary</li>
 *   <li>'primaryPreferred': read from the primary if available, otherwise from a secondary</li>
 *   <li>'secondary': read only from a secondary</li>
 *   <li>'secondaryPreferred': read from a secondary if available, otherwise from the primary</li>
 *   <li>'nearest'</li>: allow reads from either the primary the secondaries
 *  </ul>
 * @param {Object} [options.readPreference.tags]
 *  The set of tags allowed for selection of secondaries. Not usable for 'primary' mode.
 * @param {Object} [options.writeConcern]
 * @param {Number} [options.writeConcern.w=1]
 *  The write strategy.
 *  <ul>
 *   <li>0: Don't wait for acknowledgement from the server</li>
 *   <li>1: Wait for acknowledgement, but don't wait for secondaries to replicate</li>
 *   <li>&gt;=2: Wait for one or more secondaries to also acknowledge</li>
 *  </ul>
 * @param {Number} [options.writeConcern.wtimeout=0]
 *  How long to wait for slaves before failing.
 *  <ul>
 *   <li>0: indefinite</li>
 *   <li>&gt;0: time to wait in milliseconds</li>
 *  </ul>
 * @param {Boolean} [options.writeConcern.j=false]
 *  If true block until write operations have been committed to the journal. Cannot be used in combination with fsync. Prior to MongoDB 2.6 this option was ignored if
 *  the server was running without journaling. Starting with MongoDB 2.6 write operations will fail with an exception if this option is used when the server is running
 *  without journaling.
 * @param {Boolean} [options.writeConcern.fsync=false]
 *  If true and the server is running without journaling, blocks until the server has synced all data files to disk. If the server is running with journaling, this acts
 *  the same as the j option, blocking until write operations have been committed to the journal. Cannot be used in combination with j. In almost all cases the j flag
 *  should be used in preference to this one.
 * @param {Boolean} [options.cursorFinalizerEnabled=true]
 *  Whether there is a a finalize method created that cleans up instances of MongoCursor that the client does not close. If you are careful to always call the close
 *  method of MongoCursor, then this can safely be set to false.
 * @param {Boolean} [options.alwaysUseMBeans=false]
 *  Whether JMX beans registered by the driver should always be MBeans.
 * @param {Boolean} [options.sslEnabled=false]
 *  Whether to use SSL.
 * @param {Boolean} [options.sslInvalidHostNameAllowed=false]
 *  Whether invalid host names should be allowed if SSL is enabled. Take care before setting this to true, as it makes the application susceptible to man-in-the-middle
 *  attacks.
 * @param {String} [options.requiredReplicaSetName]
 *  The required replica set name. With this option set, the MongoClient instance will
 *  <ol>
 *   <li>Connect in replica set mode, and discover all members of the set based on the given servers</li>
 *   <li>Make sure that the set name reported by all members matches the required set name.</li>
 *   <li>Refuse to service any requests if any member of the seed list is not part of a replica set with the required name.</li>
 *  </ol>
 * @param {Number} [options.localThreshold=15]
 *  The local threshold. When choosing among multiple MongoDB servers to send a request, the MongoClient will only send that request to a server whose ping time is
 *  less than or equal to the server with the fastest ping time plus the local threshold. For example, let's say that the client is choosing a server to send a query
 *  when the read preference is 'secondary', and that there are three secondaries, server1, server2, and server3, whose ping times are 10, 15, and 16 milliseconds,
 *  respectively. With a local threshold of 5 milliseconds, the client will send the query to either server1 or server2 (randomly selecting between the two).
 * @param {Number} [options.serverSelectionTimeout=30000]
 *  The server selection timeout in milliseconds, which defines how long the driver will wait for server selection to succeed before throwing an exception. A value of
 *  0 means that it will timeout immediately if no server is available. A negative value means to wait indefinitely.
 * @param {Number} [options.minConnectionsPerHost=0]
 *  The minimum number of connections per host for this MongoClient instance. Those connections will be kept in a pool when idle, and the pool will ensure over time
 *  that it contains at least this minimum number.
 * @param {Number} [options.connectionsPerHost=100]
 *  The maximum number of connections allowed per host for this MongoClient instance. Those connections will be kept in a pool when idle. Once the pool is exhausted,
 *  any operation requiring a connection will block waiting for an available connection.
 * @param {Number} [options.threadsAllowedToBlockForConnectionMultiplier=5]
 *  This multiplier, multiplied with the connectionsPerHost setting, gives the maximum number of threads that may be waiting for a connection to become available from
 *  the pool. All further threads will get an exception right away. For example if connectionsPerHost is 10 and threadsAllowedToBlockForConnectionMultiplier is 5, then
 *  up to 50 threads can wait for a connection.
 * @param {Number} [options.connectTimeout=10000]
 *  The connection timeout in milliseconds. A value of 0 means no timeout. It is used solely when establishing a new connection.
 * @param {Number} [options.maxWaitTime=120000]
 *  The maximum wait time in milliseconds that a thread may wait for a connection to become available. A value of 0 means that it will not wait. A negative value means
 *  to wait indefinitely.
 * @param {Number} [options.maxConnectionIdleTime=0]
 *  The maximum idle time of a pooled connection. A zero value indicates no limit to the idle time. A pooled connection that has exceeded its idle time will be closed
 *  and replaced when necessary by a new connection.
 * @param {Number} [options.maxConnectionLifeTime=0]
 *  The maximum life time of a pooled connection. A zero value indicates no limit to the life time. A pooled connection that has exceeded its life time will be closed
 *  and replaced when necessary by a new connection.
 * @param {Boolean} [options.socketKeepAlive=false]
 *  This flag controls the socket keep alive feature that keeps a connection alive through firewalls.
 * @param {Number} [options.minHeartbeatFrequency=500]
 *  Gets the minimum heartbeat frequency. In the event that the driver has to frequently re-check a server's availability, it will wait at least this long since the
 *  previous check to avoid wasted effort.
 * @param {Number} [options.heartbeatFrequency=10000]
 *  The heartbeat frequency. This is the frequency that the driver will attempt to determine the current state of each server in the cluster.
 * @param {Number} [options.heartbeatConnectTimeout=20000]
 *  The connect timeout for connections used for the cluster heartbeat.
 * @param {Number} [options.heartbeatSocketTimeout=20000]
 *  The socket timeout for connections used for the cluster heartbeat.
 * @param {Number} [options.socketTimeout=0]
 *  The socket timeout in milliseconds. It is used for I/O socket read and write operations. 0 means no timeout.
 * @returns {MongoClient}
 */
MongoClient.connect = function(uri, options) {
	return new MongoClient(uri, options)
}

/**
 * Fetches the global {@link MongoClient} singleton, or lazily creates and sets a new one if
 * it hasn't yet been set.
 * <p>
 * The client is set as 'mongoDb.client' in {@link applications.globals}. You can set it there
 * directly, or you can set 'mongoDb.uri' and optionally 'mongoDb.options' to support lazy
 * creation.
 * In Prudence, you can also set the global in {@link application.sharedGlobals}, to allow
 * all applications to have access the same client. Note that {@link applications.globals}
 * is checked first, so it has precedence.
 */
MongoClient.global = function(applicationService) {
	var client = MongoUtil.getGlobal('client', applicationService)
	if (!MongoUtil.exists(client)) {
		var uri =  MongoUtil.getGlobal('uri', applicationService)
		if (MongoUtil.exists(uri)) {
			var options =  MongoUtil.getGlobal('options', applicationService)
			client = new MongoClient(uri, options)
			client = MongoUtil.setGlobal('client', client)
		}
	}
	return client
}

/**
 * http://api.mongodb.org/java/current/index.html?com/mongodb/client/MongoDatabase.html
 *
 * @class
 */
var MongoDatabase = function(uri /* or database */, options /* or client */) {
	var database, client
	if (uri instanceof com.mongodb.client.MongoDatabase) {
		// Just wrap
		database = uri // first argument
		client = options // second argument
	}
	else {
		// Connect
		var connection = MongoUtil.connectDatabase(uri, options)
		client = new MongoClient(connection.client)
		client.uri = connection.uri
		database = connection.database
	}

	/** @field */
	this.database = database

	/** @field */
	this.client = client
	
	/** @field */
	this.name = this.database.name
	
	//
	// Behavior
	//

	this.readPreference = function() {
		try {
			return this.database.readPreference
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.writeConcern = function() {
		try {
			return this.database.writeConcern
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {String} [options.mode] 'primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', or 'nearest'
	 * @param {Object} [options.tags]
	 */
	this.withReadPreference = function(options) {
		try {
			var readPreference = MongoUtil.readPreference(options)
			return new MongoDatabase(this.database.withReadPreference(readPreference), this.client)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.w] Number of writes
	 * @param {Number} [options.wtimeout] Timeout for writes
	 * @param {Boolean} [options.fsync] Whether writes should wait for fsync
	 * @param {Boolean} [options.j] Whether writes should wait for a journaling group commit
	 */
	this.withWriteConcern = function(options) {
		try {
			var writeConcern = MongoUtil.writeConcern(options)
			return new MongoDatabase(this.database.withWriteConcern(writeConcern), this.client)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	//
	// Operations
	//

	this.drop = function() {
		try {
			this.database.drop()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	this.commandReadPreference = null
	
	/**
	 * @param {Object} [options] Override the default readPreference for this {@link MongoDatabase}. See {@link MongoClient#connect}.
	 * @param {String} [options.mode]
	 * @param {Object} [options.tags]
	 */
	this.setCommandReadPreference = function(options) {
		this.commandReadPreference = MongoUtil.readPreference(options)
	}

	this.command = function(command) {
		try {
			var result
			command = com.mongodb.jvm.Bson.to(command)
			if (!MongoUtil.exists(this.commandReadPreference)) {
				result = this.database.runCommand(command)				
			}
			else {
				result = this.database.runCommand(command, this.commandReadPreference)
			}
			return result
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	//
	// Collections
	//

	/**
	 * @param {String} name
	 */
	this.collection = function(name) {
		try {
			// This will convert native JavaScript types
			var collection = this.database.getCollection(name, com.mongodb.jvm.Bson.documentClass)
			return new MongoCollection(collection, this)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 * @returns {MongoCollection[]}
	 */
	this.collections = function(options) {
		try {
			var collections = []
			var i = this.database.listCollectionNames().iterator()
			try {
				if (MongoUtil.exists(options)) {
					MongoUtil.mongoIterable(i, options)
				}
				while (i.hasNext()) {
					collections.push(this.collection(i.next()))
				}
			}
			finally {
				i.close()
			}
			return collections
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	/**
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 * @returns {String[]}
	 */
	this.collectionNames = function(options) {
		try {
			var collectionNames = []
			var i = this.database.listCollectionNames().iterator()
			try {
				if (MongoUtil.exists(options)) {
					MongoUtil.mongoIterable(i, options)
				}
				while (i.hasNext()) {
					collectionNames.push(i.next())
				}
			}
			finally {
				i.close()
			}
			return collectionNames
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Boolean} [options.autoIndex]
	 * @param {Boolean} [options.capped]
	 * @param {Number} [options.maxDocuments]
	 * @param {Number} [options.sizeInBytes]
	 * @param {Object} [options.storageEngineOptions]
	 * @param {Boolean} [options.usePowerOf2Sizes]
	 */
	this.createCollection = function(name, options) {
		try {
			if (!MongoUtil.exists(options)) {
				this.database.createCollection(name)
			}
			else {
				options = MongoUtil.createCollectionOptions(options)
				this.database.createCollection(name, options)
			}
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	/**
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 * @returns {String[]}
	 */
	this.collectionsToProperties = function(options) {
		var PlaceHolder = function() {} // Empty class
		
		try {
			var names = this.collectionNames(options)
			names.sort() // we want them in order, so that sub-collections will be added to their parents
			for (var n in names) {
				var name = names[n]
				var parts = String(name).split('.')
				var location = this
				for (var p in parts) {
					var part = parts[p]
					part = safeProperteryName(location, part)
					if (p == parts.length - 1) {
						location[part] = this.collection(name)
					}
					else {
						location[part] = location[part] || new PlaceHolder()
						location = location[part]
					}
				}
			}
		}
		catch (x) {
			throw new MongoError(x)
		}

		function safeProperteryName(o, name) {
			while (true) {
				if (!MongoUtil.exists(o[name]) || (o[name] instanceof MongoCollection) || (o[name] instanceof PlaceHolder)) {
					return name
				}
				name += '_'
			}
		}
	}
	
	//
	// Diagnostics
	//

	this.stats = function(scale) {
		if (!MongoUtil.exists(scale)) {
			scale = 1024
		}
		return this.command({dbStats: 1, scale: scale})
	}
	
	//
	// Server administration
	//

	this.admin = function(database) {
		var Public = {}

		Public.ping = function() {
			return database.command({ping: 1})
		}

		/**
		 * @param {Object} [sections] Enable or suppress sections (for example 'repl', 'metrics', or 'locks') 
		 */
		Public.serverStatus = function(sections) {
			var command = {serverStatus: 1}
			if (MongoUtil.exists(sections)) {
				for (var k in sections) {
					command[k] = sections[k]
				}
			}
			return database.command(command)
		}

		Public.connectionStatus = function() {
			return database.command({connectionStatus: 1})
		}

		Public.listCommands = function() {
			return database.command({listCommands: 1})
		}

		Public.buildInfo = function() {
			return database.command({buildInfo: 1})
		}

		Public.hostInfo = function() {
			return database.command({hostInfo: 1})
		}

		Public.connPoolStats = function() {
			return database.command({connPoolStats: 1})
		}

		Public.sharedConnPoolStats = function() {
			return database.command({sharedConnPoolStats: 1})
		}

		// The following are available on the 'admin' database only

		Public.listDatabases = function() {
			return database.command({listDatabases: 1})
		}

		Public.top = function() {
			return database.command({top: 1})
		}

		/**
		 * @param {String} [log='global'] 'global', 'rs', 'startupWarnings', or '*'
		 */
		Public.getLog = function(log) {
			if (!MongoUtil.exists(log)) {
				log = 'global'
			}
			return database.command({getLog: log})
		}

		Public.getCmdLineOpts = function() {
			return database.command({getCmdLineOpts: 1})
		}

		Public.getParameter = function(option) {
			var command = {getParameter: 1}
			command[option] = 1
			return database.command(command)
		}

		Public.setParameter = function(option, value) {
			var command = {setParameter: 1}
			command[option] = value
			return database.command(command)
		}

		Public.fsync = function() {
			return database.command({fsync: 1, async: true})
		}

		Public.fsyncLock = function() {
			return database.command({fsync: 1, async: false, lock: true})
		}

		Public.fsyncUnlock = function() {
			return database.command({fsync: 1, async: true, lock: false})
		}

		Public.logRotate = function() {
			return database.command({logRotate: 1})
		}

		/**
		 * @param {Boolean} [force=false]
		 * @param {Number} [timeoutSecs]
		 */
		Public.shutdown = function(force, timeoutSecs) {
			var command = {shutdown: 1}
			if (MongoUtil.exists(force)) {
				command.force = force
			}
			if (MongoUtil.exists(timeoutSecs)) {
				command.timeoutSecs = timeoutSecs
			}
			return database.command(command)
		}

		return Public
	}(this)
	
	if (this.client.collectionsToProperties) {
		this.collectionsToProperties()
	}
}

/**
 * http://api.mongodb.org/java/current/index.html?com/mongodb/client/MongoCollection.html
 *
 * @class
 */
var MongoCollection = function(uri /* or collection */, options /* or database */, database) {
	var collection, database, client
	if (uri instanceof com.mongodb.client.MongoCollection) {
		// Just wrap
		collection = uri // first argument
		database = options // second argument
		client = database.client
	}
	else {
		// Connect
		var connection = MongoUtil.connectCollection(uri, options)
		client = new MongoClient(connection.client)
		client.uri = connection.uri
		database = new MongoDatabase(connection.database, client)
		collection = connection.collection
	}

	/** @field */
	this.collection = collection

	/** @field */
	this.database = database

	/** @field */
	this.client = client
	
	/** @field */
	this.name = this.collection.namespace.collectionName
	
	/** @field */
	this.databaseName = this.collection.namespace.databaseName
	
	/** @field */
	this.fullName = this.collection.namespace.fullName
	
	//
	// Behavior
	//

	this.readPreference = function() {
		try {
			return this.collection.readPreference
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.writeConcern = function() {
		try {
			return this.collection.writeConcern
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {String} [options.mode] 'primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', or 'nearest'
	 * @param {Object} [options.tags]
	 */
	this.withReadPreference = function(options) {
		try {
			var readPreference = MongoUtil.readPreference(options)
			return new MongoCollection(this.collection.withReadPreference(readPreference), this.database)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.w] Number of writes
	 * @param {Number} [options.wtimeout] Timeout for writes
	 * @param {Boolean} [options.fsync] Whether writes should wait for fsync
	 * @param {Boolean} [options.j] Whether writes should wait for a journaling group commit
	 */
	this.withWriteConcern = function(options) {
		try {
			var writeConcern = MongoUtil.writeConcern(options)
			return new MongoCollection(this.collection.withWriteConcern(writeConcern), this.database)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	//
	// Operations
	//

	this.drop = function() {
		try {
			this.collection.drop()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	/**
	 * @param {Object} [options]
	 * @param {Boolean} [options.dropTarget]
	 */
	this.rename = function(newName, options) {
		try {
			var namespace = com.mongodb.MongoNamespace(this.databaseName, newName)
			if (!MongoUtil.exists(options)) {
				this.renameCollection(namespace)
			}
			else {
				options = MongoUtil.renameCollectionOptions(options)
				this.renameCollection(namespace, options)
			}
			this.name = this.collection.namespace.collectionName
			this.databaseName = this.collection.namespace.databaseName
			this.fullName = this.collection.namespace.fullName
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	/**
	 * @param {Boolean} [data=false]
	 * @param {Boolean} [index=false]
	 */
	this.touch = function(data, index) {
		var command = {touch: this.name}
		if (MongoUtil.exists(data)) {
			command.data = data
		}
		if (MongoUtil.exists(index)) {
			command.index = index
		}
		return this.database.command(command)
	}
	
	/**
	 * @param {Boolean} [force=false]
	 * @param {Number} [paddingFactor]
	 * @param {Number} [paddingBytes]
	 */
	this.compact = function(force, paddingFactor, paddingBytes) {
		var command = {compact: this.name}
		if (MongoUtil.exists(force)) {
			command.force = force
		}
		if (MongoUtil.exists(paddingFactor)) {
			command.paddingFactor = paddingFactor
		}
		if (MongoUtil.exists(paddingBytes)) {
			command.paddingBytes = paddingBytes
		}
		return this.database.command(command)
	}
	
	/**
	 * @param {Number} size
	 */
	this.convertToCapped = function(size) {
		return this.database.command({convertToCapped: this.name, size: size})
	}
	
	this.setFlag = function(flag, value) {
		var command = {collMod: this.name}
		command[flag] = value
		return this.database.command(command)
	}

	//
	// Indexes
	//

	/**
	 * @param {String|Object} fieldOrSpec
	 * @param {Object} [options]
	 * @param {Boolean} [options.background]
	 * @param {Number} [options.bits]
	 * @param {Number} [options.bucketSize]
	 * @param {String} [options.defaultLanguage]
	 * @param {Number} [options.expireAfter]
	 * @param {String} [options.languageOverride]
	 * @param {Number} [options.max]
	 * @param {Number} [options.min]
	 * @param {String} [options.name]
	 * @param {Boolean} [options.sparse]
	 * @param {Number} [options.sphereVersion]
	 * @param {Object} [options.storageEngine]
	 * @param {Number} [options.textVersion]
	 * @param {Boolean} [options.unique]
	 * @param {Number} [options.version]
	 * @param {Object} [options.weights]
	 */
	this.createIndex = function(fieldOrSpec, options) {
		try {
			var spec
			if (MongoUtil.isString(fieldOrSpec)) {
				spec = {}
				spec[fieldOrSpec] = 1
			}
			else {
				spec = fieldOrSpec
			}
			spec = com.mongodb.jvm.Bson.to(spec)
			if (!MongoUtil.exists(options)) {
				return this.collection.createIndex(spec)
			}
			else {
				options = MongoUtil.createIndexOptions(options)
				return this.collection.createIndex(spec, options)
			}
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Array} fieldsOrSpecs Strings or Objects
	 */
	this.createIndexes = function(fieldsOrSpecs) {
		try {
			var specs = MongoUtil.indexSpecsList(fieldsOrSpecs)
			return this.collection.createIndexes(specs)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {String|Object} fieldOrSpec
	 */
	this.dropIndex = function(fieldOrSpec) {
		try {
			if (MongoUtil.isString(fieldOrSpec)) {
				this.collection.dropIndex(fieldOrSpec)
			}
			else {
				fieldOrSpec = com.mongodb.jvm.Bson.to(fieldOrSpec)
				this.collection.dropIndex(fieldOrSpec)
			}
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.dropIndexes = function() {
		try {
			this.collection.dropIndexes()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 * @param {Number} [options.maxTime]
	 */
	this.indexes = function(options) {
		try {
			var indexes = []
			var i = this.collection.listIndexes().iterator()
			try {
				if (MongoUtil.exists(options)) {
					MongoUtil.listIndexesIterable(i, options)
				}
				while (i.hasNext()) {
					indexes.push(i.next())
				}
			}
			finally {
				i.close()
			}
			return indexes
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	this.reIndex = function() {
		return this.database.command({reIndex: this.name})
	}
	
	/**
	 * Currently can only change expireAfterSeconds option.
	 */
	this.modifyIndex = function(fieldOrSpec, options) {
		if (MongoUtil.isString(fieldOrSpec)) {
			var spec = {}
			spec[fieldOrSpec] = 1
			fieldOrSpec = spec
		}
		var index = {keyPattern: fieldOrSpec}
		for (var k in options) {
			index[k] = options[k]
		}
		return this.setFlag('index', index)
	}

	//
	// Queries
	//

	/**
	 * @param {Object} [filter]
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 * @param {String|com.mongodb.CursorType} [options.cursorType] 'nonTailable', 'tailable', or 'tailableAwait'
	 * @param {Object} [options.filter]
	 * @param {Number} [options.limit]
	 * @param {Number} [options.maxTime]
	 * @param {Object} [options.modifiers]
	 * @param {Boolean} [options.noCursorTimeout]
	 * @param {Boolean} [options.oplogReplay]
	 * @param {Boolean} [options.partial]
	 * @param {Object} [options.projection]
	 * @param {Number} [options.skip]
	 * @param {Object} [options.sort]
	 */
	this.find = function(filter, options) {
		try {
			var i
			if (!MongoUtil.exists(filter)) {
				i = this.collection.find()
			}
			else {
				filter = com.mongodb.jvm.Bson.to(filter)
				i = this.collection.find(filter)
			}
			if (MongoUtil.exists(options)) {
				MongoUtil.findIterable(i, options)
			}
			return new MongoCursor(i, this, filter)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * This is a convenience function. It calls find and fetches the first document.
	 *
	 * @param {Object} [filter]
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 * @param {String|com.mongodb.CursorType} [options.cursorType] 'nonTailable', 'tailable', or 'tailableAwait'
	 * @param {Object} [options.filter]
	 * @param {Number} [options.limit]
	 * @param {Number} [options.maxTime]
	 * @param {Object} [options.modifiers]
	 * @param {Boolean} [options.noCursorTimeout]
	 * @param {Boolean} [options.oplogReplay]
	 * @param {Boolean} [options.partial]
	 * @param {Object} [options.projection]
	 * @param {Number} [options.skip]
	 * @param {Object} [options.sort]
	 */
	this.findOne = function(filter, options) {
		var cursor = this.find(filter, options)
		return cursor.first()
	}

	//
	// Aggregate queries
	//
	
	/**
	 * @param {Object} [filter]
	 * @param {Object} [options]
	 * @param {Object} [options.hint]
	 * @param {String} [options.hintString]
	 * @param {Number} [options.limit]
	 * @param {Number} [options.maxTime]
	 * @param {Number} [options.skip]
	 */
	this.count = function(filter, options) {
		try {
			if (!MongoUtil.exists(filter)) {
				return this.collection.count()
			}
			else {
				filter = com.mongodb.jvm.Bson.to(filter)
				if (!MongoUtil.exists(options)) {
					return this.collection.count(filter)
				}
				else {
					options = MongoUtil.countOptions(options)
					return this.collection.count(filter, options)
				}
			}
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Number} [options.batchSize]
	 * @param {Object} [options.filter]
	 * @param {Number} [options.maxTime]
	 */
	this.distinct = function(key, options) {
		try {
			var i = this.collection.distinct(key, java.lang.Object)
			if (MongoUtil.exists(options)) {
				MongoUtil.distinctIterable(i, options)
			}
			// TODO
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object[]} pipeline
	 * @param {Object} [options]
	 * @param {Boolean} [options.allowDiskUse]
	 * @param {Number} [options.batchSize]
	 * @param {Number} [options.maxTime]
	 * @param {Boolean} [options.useCursor]
	 */
	this.aggregate = function(pipeline, options) {
		try {
			pipeline = MongoUtil.documentList(pipeline)
			pipeline = com.mongodb.jvm.Bson.to(pipline)
			var i = this.collection.aggregate(pipeline)
			if (MongoUtil.exists(options)) {
				MongoUtil.aggregateIterable(i, options)
			}
			return new MongoCursor(i, this)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	/**
	 * @param {Object} args.key
	 * @param {Function} [args.reduce=function(c,r){}]
	 * @param {Object} [args.initial]
	 * @param {Function} [args.keyf]
	 * @param {Object} [args.filter]
	 * @param {Function} [args.finalize]
	 */
	this.group = function(args) {
		if (!MongoUtil.exists(args.initial)) {
			args.initial = {}
		}
		if (!MongoUtil.exists(args.reduce)) {
			args.reduce = function(c,r){}
		}
		var command = {
			group: {
				ns: this.name,
				key: args.key,
				initial: args.initial,
				$reduce: String(args.reduce)
			}
		}
		if (MongoUtil.exists(args.keyf)) {
			command.group.$keyf = String(args.keyf)
		}
		if (MongoUtil.exists(args.filter)) {
			command.group.cond = args.filter
		}
		if (MongoUtil.exists(args.finalize)) {
			command.group.finalize = String(args.finalize)
		}
		return this.database.command(command)
	}
	
	/**
	 * @param {Function} args.map
	 * @param {Function} args.reduce
	 * @param {String|Object} [args.out={inline: 1}]
	 * @param {Object} [args.filter]
	 * @param {Object} [args.sort]
	 * @param {Number} [args.limit]
	 * @param {Object} [args.scope]
	 * @param {Function} [args.finalize]
	 * @param {Boolean} [args.jsMode=false]
	 * @param {Boolean} [args.verbose=true]
	 */
	this.mapReduce = function(args) {
		if (!MongoUtil.exists(args.out)) {
			args.out = {inline: 1}
		}
		var command = {
			mapReduce: this.name,
			map: String(args.map),
			reduce: String(args.reduce),
			out: args.out
		}
		if (MongoUtil.exists(args.filter)) {
			command.query = args.filter
		}
		if (MongoUtil.exists(args.sort)) {
			command.sort = args.sort
		}
		if (MongoUtil.exists(args.limit)) {
			command.limit = args.limit
		}
		if (MongoUtil.exists(args.scope)) {
			command.scope = args.scope
		}
		if (MongoUtil.exists(args.finalize)) {
			command.finalize = String(args.finalize)
		}
		if (MongoUtil.exists(args.jsMode)) {
			command.jsMode = args.jsMode
		}
		if (MongoUtil.exists(args.verbose)) {
			command.verbose = args.verbose
		}
		return this.database.command(command)
	}
	
	//
	// Geospatial queries
	//
	
	/**
	 * @param {Object} [options]
	 * @param {Boolean} [options.spherical]
	 * @param {Number} [options.distanceMultiplier]
	 * @param {Object} [options.filter]
	 * @param {Boolean} [options.includeLocations]
	 * @param {Number} [options.limit]
	 * @param {Number} [options.maxDistance]
	 * @param {Number} [options.minDistance]
	 * @param {Number} [options.num]
	 * @param {Boolean} [options.uniqueDocs]
	 */
	this.geoNear = function(x, y, options) {
	}

	/**
	 * @param {Object} [options]
	 * @param {Object} [options.filter]
	 * @param {Number} [options.maxDistance]
	 * @param {Number} [options.limit]
	 */
	this.geoHaystackSearch = function(x, y, options) {
	}

	//
	// Insertion
	//

	/**
	 * @param {Object[]} [docs]
	 * @param {Object} [options]
	 * @param {Boolean} [options.ordered]
	 */
	this.insertMany = function(docs, options) {
		try {
			docs = MongoUtil.documentList(docs)
			if (!MongoUtil.exists(options)) {
				this.collection.insertMany(docs)
			}
			else {
				options = MongoUtil.insertManyOptions(options)
				this.collection.insertMany(docs, options)
			}
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [doc]
	 */
	this.insertOne = function(doc) {
		try {
			this.collection.insertOne(doc)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	//
	// Deletion
	//

	/**
	 * 
	 */
	this.deleteMany = function(filter) {
		try {
			filter = com.mongodb.jvm.Bson.to(filter)
			var result = this.collection.deleteMany(filter)
			return MongoUtil.deleteResult(result)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.deleteOne = function(filter) {
		try {
			filter = com.mongodb.jvm.Bson.to(filter)
			var result = this.collection.deleteOne(filter)
			return MongoUtil.deleteResult(result)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.maxTime]
	 * @param {Object} [options.projection]
	 * @param {Object} [options.sort]
	 */
	this.findOneAndDelete = function(filter, options) {
		try {
			filter = com.mongodb.jvm.Bson.to(filter)
			if (!MongoUtil.exists(options)) {
				result = this.collection.findOneAndDelete(filter)
			}
			else {
				options = MongoUtil.findOneAndDeleteOptions(options)
				result = this.collection.findOneAndDelete(filter, options)
			}
			return result
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	//
	// Replacement
	//

	/**
	 * @param {Object} [filter]
	 * @param {Object} [replacement]
	 * @param {Object} [options]
	 * @param {Boolean} [options.upsert]
	 */
	this.replaceOne = function(filter, replacement, options) {
		try {
			filter = com.mongodb.jvm.Bson.to(filter)
			if (!MongoUtil.exists(options)) {
				result = this.collection.replaceOne(filter, replacement)
			}
			else {
				options = MongoUtil.replacementOptions(options)
				result = this.collection.replaceOne(filter, replacement, options)
			}
			return MongoUtil.updateResult(result)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.maxTime]
	 * @param {Object} [options.projection]
	 * @param {String|com.mongodb.client.model.ReturnDocument} [options.returnDocument] 'after' or 'before'
	 * @param {Object} [options.sort]
	 * @param {Boolean} [options.upsert]
	 */
	this.findOneAndReplace = function(filter, replacement, options) {
		try {
			filter = com.mongodb.jvm.Bson.to(filter)
			if (!MongoUtil.exists(options)) {
				result = this.collection.findOneAndReplace(filter, replacement)
			}
			else {
				options = MongoUtil.findOneAndReplaceOptions(options)
				result = this.collection.findOneAndReplace(filter, replacement, options)
			}
			return result
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	//
	// Update
	//

	/**
	 * @param {Object} [filter]
	 * @param {Object} [update]
	 * @param {Object} [options]
	 * @param {Boolean} [options.upsert]
	 */
	this.updateMany = function(filter, update, options) {
		try {
			filter = com.mongodb.jvm.Bson.to(filter)
			update = com.mongodb.jvm.Bson.to(update)
			if (!MongoUtil.exists(options)) {
				result = this.collection.updateMany(filter, update)
			}
			else {
				options = MongoUtil.updateOptions(options)
				result = this.collection.updateMany(filter, update, options)
			}
			return MongoUtil.updateResult(result)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [filter]
	 * @param {Object} [update]
	 * @param {Object} [options]
	 * @param {Boolean} [options.upsert]
	 */
	this.updateOne = function(filter, update, options) {
		try {
			filter = com.mongodb.jvm.Bson.to(filter)
			update = com.mongodb.jvm.Bson.to(update)
			if (!MongoUtil.exists(options)) {
				result = this.collection.updateOne(filter, update)
			}
			else {
				options = MongoUtil.updateOptions(options)
				result = this.collection.updateOne(filter, update, options)
			}
			return MongoUtil.updateResult(result)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.maxTime]
	 * @param {Object} [options.projection]
	 * @param {String|com.mongodb.client.model.ReturnDocument} [options.returnDocument] 'after' or 'before'
	 * @param {Object} [options.sort]
	 * @param {Boolean} [options.upsert]
	 */
	this.findOneAndUpdate = function(filter, update, options) {
		try {
			filter = com.mongodb.jvm.Bson.to(filter)
			update = com.mongodb.jvm.Bson.to(update)
			if (!MongoUtil.exists(options)) {
				result = this.collection.findOneAndUpdate(filter, update)
			}
			else {
				options = MongoUtil.findOneAndUpdateOptions(options)
				result = this.collection.findOneAndUpdate(filter, update, options)
			}
			return result
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * Update an existing document or, if it doesn't exist, insert it.
	 * <p>
	 * This is a convenience function. If the document <i>does not</i> have an _id,
	 * it will call insertOne. If the document <i>does</i> have an _id, it will
	 * call updateOne with upsert=true. The upsert is there to guarantee that
	 * the object is saved even if it has been deleted.
	 * 
	 * @param {Object} [doc]
	 * @param {Object} [options] Only used when updateOne is called
	 */
	this.save = function(doc, options) {
		if (!MongoUtil.exists(doc._id)) {
			// Insert
			this.insertOne(doc)
			return null
		}
		else {
			// Update
			if (!MongoUtil.exists(options)) {
				options = {upsert: true}
			}
			else {
				options.upsert = true
			}
			var id = doc._id
			delete doc._id
			var update = {$set: doc}
			try {
				return this.updateOne({_id: id}, update, options)
			}
			finally {
				doc._id = id
			}
		}
	}
	
	//
	// Bulk write
	//

	/**
	 * type can be 'deleteMany', 'deleteOne', 'insertOne', 'replaceOne', 'updateMany', 'updateOne'
	 *
	 *
	 * @param {Object} [options]
	 * @param {Boolean} [options.ordered]
	 */
	this.bulkWrite = function(operations, options) {
		try {
			operations = MongoUtil.writeModels(operations)
			if (!MongoUtil.exists(options)) {
				this.collection.bulkeWrite(operations)
			}
			else {
				options = MongoUtil.bulkWriteOptions(options)
				this.collection.bulkeWrite(operations, options)
			}
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	//
	// Diagnostics
	//

	/**
	 * @param {Number} [scale]
	 * @param {Boolean} [verbose]
	 */
	this.stats = function(scale, verbose) {
		if (!MongoUtil.exists(scale)) {
			scale = 1024
		}
		if (!MongoUtil.exists(verbose)) {
			verbose = false
		}
		return this.database.command({collStats: this.name, scale: scale, verbose: verbose})
	}

	/**
	 * @param {String} operation
	 * @param {String} [verbosity='allPlansExecution'] 'queryPlanner', 'executionStats', or 'allPlansExecution'
	 */
	this.explainRaw = function(operation, args, verbosity) {
		var command = {explain: {}}
		// Note: the order *matters*, and the operation *must* be the first key in the dict
		command.explain[operation] = this.name
		for (var k in args) {
			if (args.hasOwnProperty(k)) {
				command.explain[k] = args[k]
			}
		}
		if (MongoUtil.exists(verbosity)) {
			command.verbosity = verbosity
		}
		return this.database.command(command)
	}

	this.explain = function(collection) {
		var Public = {}
		
		/**
		 * 'queryPlanner', 'executionStats', or 'allPlansExecution'
		 * <p>
		 * Defaults to 'allPlansExecution'
		 * 
		 * @field
		 */
		Public.verbosity = null
		
		Public.find = function(filter) {
			filter = filter || {}
			return collection.explainRaw('find', {filter: filter}, this.verbosity)
		}

		Public.count = function(filter) {
			filter = filter || {}
			return collection.explainRaw('count', {query: filter}, this.verbosity)
		}

		Public.group = function(args) {
			if (!MongoUtil.exists(args.initial)) {
				args.initial = {}
			}
			if (!MongoUtil.exists(args.reduce)) {
				args.reduce = function(c,r){}
			}
			var group = {
				ns: collection.name,
				key: args.key,
				initial: args.initial,
				$reduce: String(args.reduce)
			}
			if (MongoUtil.exists(args.keyf)) {
				group.$keyf = String(args.keyf)
			}
			if (MongoUtil.exists(args.filter)) {
				group.cond = args.filter
			}
			if (MongoUtil.exists(args.finalize)) {
				group.finalize = String(args.finalize)
			}
			return collection.explainRaw('group', {group: group}, this.verbosity)
		}

		Public.deleteOne = function(filter) {
			filter = filter || {}
			return collection.explainRaw('delete', {deletes: [{q: filter, limit: 1}]}, this.verbosity)
		}
	
		Public.deleteMany = function(filter) {
			filter = filter || {}
			return collection.explainRaw('delete', {deletes: [{q: filter, limit: 0}]}, this.verbosity)
		}
	
		Public.updateMany = function(filter, update, options) {
			filter = filter || {}
			update = update || {}
			var upsert = MongoUtil.exists(options) && options.upsert
			return collection.explainRaw('update', {updates: [{q: filter, u: update, upsert: upsert, multi: true}]}, this.verbosity)
		}

		Public.updateOne = function(filter, update, options) {
			filter = filter || {}
			update = update || {}
			var upsert = MongoUtil.exists(options) && options.upsert
			return collection.explainRaw('update', {updates: [{q: filter, u: update, upsert: upsert, multi: false}]}, this.verbosity)
		}
		
		return Public
	}(this)
}

/**
 * This class does not exactly represent a cursor: it will create a cursor in the database only
 * when data is accessed, and will keep it open until {@link MongoCursor#close} is called.
 * <p>
 * Thus, you can access data again even <i>after</i> calling {@link MongoCursor#close}, which
 * would cause a fresh new cursor to be created.
 * <p>
 * It is recommended to use try/finally semantics when iterating a cursor, to ensure that it is
 * closed when finished, even if an exception is thrown:
 * <p>
 * <pre>
 * var c = collection.find()
 * try {
 *   while (c.hasNext()) {
 *     println(c.next().name)
 *   }
 * }
 * finally {
 *   c.close()
 * }
 * </pre>
 * 
 * http://api.mongodb.org/java/current/index.html?com/mongodb/client/MongoCursor.html
 *
 * @class
 */
var MongoCursor = function(iterable, collection, filter) {
	this.iterable = iterable
	this.collection = collection
	this.filter = filter
	this.cursor = null
	
	/**
	 * A convenience function to get the first entry in the cursor, after which it is immediately
	 * closed.
	 */
	this.first = function() {
		try {
			return this.iterable.first()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	/**
	 * This is a convenience function. It calls count using the filter
	 * used to create this cursor.
	 * 
	 * @param {Object} [options]
	 * @param {Object} [options.hint]
	 * @param {String} [options.hintString]
	 * @param {Number} [options.limit]
	 * @param {Number} [options.maxTime]
	 * @param {Number} [options.skip]
	 */
	this.count = function(options) {
		return this.collection.count(this.filter, options)
	}

	this.hasNext = function() {
		try {
			if (null === this.cursor) {
				this.cursor = iterable.iterator()
			}
			return this.cursor.hasNext()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	this.next = function() {
		try {
			if (null === this.cursor) {
				this.cursor = iterable.iterator()
			}
			return this.cursor.next()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	this.close = function() {
		try {
			if (null !== this.cursor) {
				this.cursor.close()
				this.cursor = null
			}
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
}

/**
 * http://api.mongodb.org/java/current/index.html?com/mongodb/MongoException.html
 *
 * @class
 */
var MongoError = function(x) {
	if (MongoUtil.exists(x.javaException)) {
		// For Rhino, unwrap
		x = x.javaException
	}
	
	this.exception = x
	
	if (x instanceof com.mongodb.MongoCommandException) {
		this.code = x.code
		this.message = x.message
		this.serverAddress = String(x.serverAddress)
		this.response = x.response
	}
	else if (x instanceof com.mongodb.MongoBulkWriteException) {
		this.code = x.code
		this.message = x.message
		this.serverAddress = String(x.serverAddress)
		var writeConcern = x.writeConcernError
		if (MongoUtil.exists(writeConcern)) {
			this.writeConcern = {
				code: writeConcern.code,
				message: writeConcern.message,
				details: writeConcern.details
			}
		}
		var writeErrors = x.writeErrors
		if (MongoUtil.exists(writeErrors)) {
			this.writeErrors = []
			var i = writeErrors.iterator()
			while (i.hasNext()) {
				var writeError = i.next()
				this.writeErrors.push({
					index: writeError.index,
					code: writeError.code,
					message: writeError.message,
					category: String(writeError.category),
					details: writeError.details
				})
			}
		}
		var writeResult = x.writeResult
		if (MongoUtil.exists(writeResult)) {
			this.writeResult = MongoUtil.bulkWriteResult(writeResult)
		}
	}
	else if (x instanceof com.mongodb.MongoServerException) {
		this.code = x.code
		this.message = x.message
		this.serverAddress = String(x.serverAddress)
	}
	else if (x instanceof com.mongodb.MongoException) {
		this.code = x.code
		this.message = x.message
	}
	else if (x instanceof java.lang.Throwable) {
		this.message = x.message
	}
	else if (x instanceof MongoError) {
		this.code = x.code
		this.message = x.message
		this.serverAddress = x.serverAddress
		this.response = x.response
		this.writeConcern = x.writeConcern
		this.writeErrors = x.writeErrors
		this.writeResult = x.writeResult
	}
	else {
		this.message = x
	}
	
	this.hasCode = function(code) {
		if (code == this.code) {
			return true
		}
		if (MongoUtil.exists(this.writeConcern)) {
			if (code == this.writeConcern.code) {
				return true
			}
		}
		if (MongoUtil.exists(this.writeErrors)) {
			for (var e in this.writeErrors) {
				if (code == this.writeErrors[e].code) {
					return true
				}
			}
		}
		return false
	}
	
	this.clean = function() {
		return MongoUtil.prune(this, ['code', 'message', 'serverAddress', 'response', 'writeConcern', 'writeErrors', 'writeResult'])
	}
}

MongoError.represent = function(x, full) {
	var s = new java.io.StringWriter()
	var out = new java.io.PrintWriter(s)
	if (x instanceof MongoError) {
		out.println('MongoDB error:')
		out.println(String(Sincerity.JSON.to(x.clean(), true)))
		if (full) {
			x.exception.printStackTrace(out)
		}
	}
	else if (x instanceof java.lang.Throwable) {
		out.println('JVM error:')
		if (!full) {
			out.println(String(x))
		}
		else {
			x.printStackTrace(out)
		}
	}
	else if (x.nashornException) {
		out.println('JavaScript error:')
		if (!full) {
			out.println(String(x.nashornException))
		}
		else {
			x.nashornException.printStackTrace(out)
		}
	}
	else if (x.javaException) {
		out.println('JavaScript error:')
		if (!full) {
			out.println(String(x.javaException))
		}
		else {
			x.javaException.printStackTrace(out)
		}
	}
	else {
		out.println('Error:')
		out.println(String(Sincerity.JSON.to(x, true)))
	}
	return String(s)
}

/** @constant */
MongoError.GONE = -2
/** @constant */
MongoError.NOT_FOUND = -5
/** @constant */
MongoError.COLLECTION_ALREADY_EXISTS = 48
/** @constant */
MongoError.CAPPED = 10003
/** @constant */
MongoError.DUPLICATE_KEY = 11000
/** @constant */
MongoError.DUPLICATE_KEY_ON_UPDATE = 11001

/**
 * @namespace
 */
var MongoUtil = function() {
	/** @exports Public as MongoUtil */
	var Public = {}

	//
	// MongoDB utilities
	//
	
	/**
	 * @param {String|byte[]} [raw]
	 */
	Public.id = function(raw) {
		if (!Public.exists(raw)) {
			return new org.bson.types.ObjectId()
		}
		else {
			return new org.bson.types.ObjectId(raw)
		}
	}

	//
	// General-purpose JavaScript utilities
	//

	Public.exists = function(value) {
		// Note the order: we need the value on the right side for Rhino not to
		// complain about non-JS objects
		return (undefined !== value) && (null !== value)
	}

	Public.isString = function(value) {
		try {
			return (value instanceof String) || (typeof value === 'string')
		}
		catch (x) {
			return false
		}
	}

	Public.applyOptions = function(target, source, options) {
		for (var o in options) {
			var option = options[o]
			if (Public.exists(source[option])) {
				target[option](source[option])
			}
		}
	}
	
	Public.prune = function(o, keys) {
		var r = {}
		for (var k in keys) {
			var key = keys[k]
			var value = o[key]
			if (Public.exists(value)) {
				r[key] = value
			}
		}
		return r
	}

	//
	// Scripturian utilities
	//

	Public.getGlobal = function(name, applicationService) {
		if (!MongoUtil.exists(applicationService)) {
			applicationService = application
		}
		var fullName = 'mongoDb.' + name
		var value = null
		// In Scripturian
		try {
			value = applicationService.globals.get(fullName)
		}
		catch (x) {}
		// In Prudence
		if (!Public.exists(value)) {
			try {
				value = applicationService.sharedGlobals.get(fullName)
			}
			catch (x) {}
		}
		// In Prudence initialization scripts
		if (!Public.exists(value)) {
			try {
				value = app.globals.mongoDb[name]
			}
			catch (x) {}
		}
		if (!Public.exists(value)) {
			try {
				value = app.globals[fullName]
			}
			catch (x) {}
		}
		if (!Public.exists(value)) {
			try {
				value = app.sharedGlobals.mongoDb[name]
			}
			catch (x) {}
		}
		if (!Public.exists(value)) {
			try {
				value = app.sharedGlobals[fullName]
			}
			catch (x) {}
		}
		return value
	}
	
	Public.setGlobal = function(name, value, applicationService) {
		if (!MongoUtil.exists(applicationService)) {
			applicationService = application
		}
		var fullName = 'mongoDb.' + name
		// In Scripturian
		value = applicationService.getGlobal(fullName, value)
		try {
			// In Prudence initialization scripts
			app.globals.mongoDb = app.globals.mongoDb || {}
			app.globals.mongoDb.client = Public.client
		}
		catch (x) {}
		return value
	}
	
	//
	// Driver utilities
	//
	
	// Connection
	
	Public.connectClient = function(uri, options) {
		if (!Public.exists(uri)) {
			uri = 'mongodb://localhost/'
		}
		uri = Public.clientUri(uri, options)
		try {
			var client = new com.mongodb.MongoClient(uri)
			return {
				uri: uri,
				client: client
			}
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	Public.connectDatabase = function(uri, options) {
		if (!Public.exists(uri)) {
			uri = 'mongodb://localhost/default'
		}
		uri = Public.clientUri(uri, options)
		if (!Public.exists(uri.database)) {
			throw new MongoError('URI does not specify database')
		}
		var connection = Public.connectClient(uri)
		try {
			connection.database = connection.client.getDatabase(uri.database)
			return connection
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	Public.connectCollection = function(uri, options) {
		if (!Public.exists(uri)) {
			uri = 'mongodb://localhost/default.default'
		}
		uri = Public.clientUri(uri, options)
		if (!Public.exists(uri.collection)) {
			throw new MongoError('URI does not specify collection')
		}
		var connection = Public.connectDatabase(uri)
		try {
			connection.collection = connection.database.getCollection(uri.collection, com.mongodb.jvm.Bson.documentClass)
			return connection
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	// Arguments

	/**
	 * @return {<a href="http://api.mongodb.org/java/current/index.html?com/mongodb/MongoClientURI.html">com.mongodb.MongoClientURI</a>}
	 */
	Public.clientUri = function(uri, options) {
		try {
			if (!(uri instanceof com.mongodb.MongoClientURI)) {
				if (Public.exists(options)) {
					options = Public.clientOptions(options)
					uri = new com.mongodb.MongoClientURI(uri, options)
				}
				else {
					uri = new com.mongodb.MongoClientURI(uri)
				}
			}
			return uri
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	Public.documentList = function(array) {
		// TODO: is this really necessary?
		var list = new java.util.ArrayList(array.length)
		for (var a in array) {
			list.add(array[a])
		}
		return list
	}
	
	Public.indexSpecsList = function(fieldsOrSpecs) {
		var list = new java.util.ArrayList(fieldsOrSpecs.length)
		for (var f in fieldsOrSpecs) {
			var fieldOrSpec = fieldsOrSpecs[f]
			if (Public.isString(fieldOrSpec)) {
				var spec = {}
				spec[fieldOrSpec] = 1
				fieldOrSpec = spec
			}
			list.add(fieldOrSpec)
		}
		return list
	}
	
	Public.writeModelList = function(array) {
		var list = new java.util.ArrayList(array.length)
		for (var a in array) {
			var entry = array[a]
			entry = Public.writeModel(entry)
			list.add(entry)
		}
		return list
	}
	
	// Options
	
	Public.clientOptions = function(options) {
		if (!(options instanceof com.mongodb.MongoClientOptions.Builder)) {
			var clientOptions = com.mongodb.MongoClientOptions.builder()
			Public.applyOptions(clientOptions, options, ['alwaysUseMBeans', 'connectionsPerHost', 'connectTimeout', 'cursorFinalizerEnabled', 'description', 'heartbeatConnectTimeout', 'heartbeatFrequency', 'heartbeatSocketTimeout', 'localThreshold', 'maxConnectionIdleTime', 'maxConnectionLifeTime', 'maxWaitTime', 'minConnectionsPerHost', 'minHeartbeatFrequency', 'requiredReplicaSetName', 'serverSelectionTimeout', 'socketKeepAlive', 'socketTimeout', 'sslEnabled', 'sslInvalidHostNameAllowed', 'threadsAllowedToBlockForConnectionMultiplier'])
			if (Public.exists(options.readPreference)) {
				clientOptions.readPreference(Public.readPreference(options.readPreference))
			}
			if (Public.exists(options.writeConcern)) {
				clientOptions.writeConcern(Public.writeConcern(options.writeConcern))
			}
			options = clientOptions
		}
		
		// This will convert native JavaScript types
		options.codecRegistry(com.mongodb.jvm.Bson.codecRegistry)
		
		return options
	}
	
	Public.clientOptionsFromStringMap = function(map, options) {
		var json = ['readPreference.tags']
		var boolean = ['writeConcern.j', 'writeConcern.fsync', 'cursorFinalizerEnabled', 'alwaysUseMBeans', 'sslEnabled', 'sslInvalidHostNameAllowed', 'socketKeepAlive']
		var integer = ['writeConcern.w', 'writeConcern.wtimeout', 'localThreshold', 'serverSelectionTimeout', 'minConnectionsPerHost', 'connectionsPerHost', 'threadsAllowedToBlockForConnectionMultiplier', 'connectTimeout', 'maxWaitTime', 'maxConnectionIdleTime', 'maxConnectionLifeTime', 'minHeartbeatFrequency', 'heartbeatFrequency', 'heartbeatConnectTimeout', 'heartbeatSocketTimeout', 'socketTimeout']
		
		for (var i = map.entrySet().iterator(); i.hasNext(); ) {
			var e = i.next()
			var key = e.key, value = e.value
			
			for (var o in json) {
				if (key == o) {
					value = Sincerity.JSON.from(value)
				}
			}
			for (var o in boolean) {
				if (key == o) {
					value = value == 'true' ? true : false
				}
			}
			for (var o in integer) {
				if (key == o) {
					value = parseInt(value)
				}
			}
			
			var parts = key.split('.')
			var location = options
			for (var p in parts) {
				var part = parts[p]
				if (p == parts.length - 1) {
					location[part] = value
				}
				else {
					location[part] = location[part] || {}
					location = location[part]
				}
			}
		}
	}
	
	Public.createCollectionOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.CreateCollectionOptions)) {
			var createCollectionOptions = new com.mongodb.client.model.CreateCollectionOptions()
			Public.applyOptions(createCollectionOptions, options, ['autoIndex', 'capped', 'maxDocuments', 'sizeInBytes', 'usePowerOf2Sizes'])
			if (Public.exists(options.storageEngineOptions)) {
				createCollectionOptions.storageEngineOptions(com.mongodb.jvm.Bson.to(options.storageEngineOptions))
			}
			options = createCollectionOptions
		}
		return options
	}
	
	Public.countOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.CountOptions)) {
			var countOptions = new com.mongodb.client.model.CountOptions()
			Public.applyOptions(countOptions, options, ['hintString', 'limit', 'skip'])
			if (Public.exists(options.hint)) {
				countOptions.hint(com.mongodb.jvm.Bson.to(options.hint))
			}
			if (Public.exists(options.maxTime)) {
				countOptions.maxTime(options.maxTime, java.util.concurrent.TimeUnit.MILLISECONDS)
			}
			options = countOptions
		}
		return options
	}
	
	Public.createIndexOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.IndexOptions)) {
			var indexOptions = new com.mongodb.client.model.IndexOptions()
			Public.applyOptions(indexOptions, options, ['background', 'bits', 'bucketSize', 'defaultLanguage', 'languageOverride', 'max', 'min', 'name', 'sparse', 'sphereVersion', 'textVersion', 'unique', 'version'])
			if (Public.exists(options.expireAfter)) {
				indexOptions.expireAfter(options.expireAfter, java.util.concurrent.TimeUnit.MILLISECONDS)
			}
			if (Public.exists(options.storageEngine)) {
				indexOptions.storageEngine(com.mongodb.jvm.Bson.to(options.expireAfter))
			}
			if (Public.exists(options.weights)) {
				indexOptions.weights(com.mongodb.jvm.Bson.to(options.weights))
			}
			options = indexOptions
		}
		return options
	}

	Public.findOneAndDeleteOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.FindOneAndDeleteOptions)) {
			var findOneAndDeleteOptions = new com.mongodb.client.model.FindOneAndDeleteOptions()
			if (Public.exists(options.maxTime)) {
				findOneAndDeleteOptions.maxTime(options.maxTime, java.util.concurrent.TimeUnit.MILLISECONDS)
			}
			if (Public.exists(options.projection)) {
				findOneAndDeleteOptions.projection(com.mongodb.jvm.Bson.to(options.projection))
			}
			if (Public.exists(options.sort)) {
				findOneAndDeleteOptions.sort(com.mongodb.jvm.Bson.to(options.sort))
			}
			options = findOneAndDeleteOptions
		}
		return options
	}

	Public.findOneAndReplaceOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.FindOneAndReplaceOptions)) {
			var findOneAndReplaceOptions = new com.mongodb.client.model.FindOneAndReplaceOptions()
			Public.applyOptions(findOneAndReplaceOptions, options, ['upsert'])
			if (Public.exists(options.maxTime)) {
				findOneAndReplaceOptions.maxTime(options.maxTime, java.util.concurrent.TimeUnit.MILLISECONDS)
			}
			if (Public.exists(options.projection)) {
				findOneAndReplaceOptions.projection(com.mongodb.jvm.Bson.to(options.projection))
			}
			if (Public.exists(options.returnDocument)) {
				if (options.returnDocument instanceof com.mongodb.client.model.ReturnDocument) {
					findOneAndReplaceOptions.returnDocument(options.returnDocument)
				}
				else {
					switch (options.returnDocument) {
					case 'after':
						findOneAndReplaceOptions.returnDocument(com.mongodb.client.model.ReturnDocument.AFTER)
						break
					case 'before':
						findOneAndReplaceOptions.returnDocument(com.mongodb.client.model.ReturnDocument.BEFORE)
						break
					default:
						throw new MongoException('Unsupported return document: ' + options.returnDocument)
					}
				}
			}
			if (Public.exists(options.sort)) {
				findOneAndReplaceOptions.sort(com.mongodb.jvm.Bson.to(options.sort))
			}
			options = findOneAndReplaceOptions
		}
		return options
	}

	Public.findOneAndUpdateOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.FindOneAndUpdateOptions)) {
			var findOneAndUpdateOptions = new com.mongodb.client.model.FindOneAndUpdateOptions()
			Public.applyOptions(findOneAndUpdateOptions, options, ['upsert'])
			if (Public.exists(options.maxTime)) {
				findOneAndUpdateOptions.maxTime(options.maxTime, java.util.concurrent.TimeUnit.MILLISECONDS)
			}
			if (Public.exists(options.projection)) {
				findOneAndUpdateOptions.projection(com.mongodb.jvm.Bson.to(options.projection))
			}
			if (Public.exists(options.returnDocument)) {
				if (options.returnDocument instanceof com.mongodb.client.model.ReturnDocument) {
					findOneAndUpdateOptions.returnDocument(options.returnDocument)
				}
				else {
					switch (options.returnDocument) {
					case 'after':
						findOneAndUpdateOptions.returnDocument(com.mongodb.client.model.ReturnDocument.AFTER)
						break
					case 'before':
						findOneAndUpdateOptions.returnDocument(com.mongodb.client.model.ReturnDocument.BEFORE)
						break
					default:
						throw new MongoException('Unsupported return document: ' + options.returnDocument)
					}
				}
			}
			if (Public.exists(options.sort)) {
				findOneAndUpdateOptions.sort(com.mongodb.jvm.Bson.to(options.sort))
			}
			options = findOneAndUpdateOptions
		}
		return options
	}

	Public.updateOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.UpdateOptions)) {
			var updateOptions = new com.mongodb.client.model.UpdateOptions()
			Public.applyOptions(updateOptions, options, ['upsert'])
			options = updateOptions
		}
		return options
	}

	Public.insertManyOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.InsertManyOptions)) {
			var insertManyOptions = new com.mongodb.client.model.InsertManyOptions()
			Public.applyOptions(insertManyOptions, options, ['ordered'])
			options = insertManyOptions
		}
		return options
	}

	Public.renameCollectionOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.RenameCollectionOptions)) {
			var renameCollectionOptions = new com.mongodb.client.model.RenameCollectionOptions()
			Public.applyOptions(renameCollectionOptions, options, ['dropTarget'])
			options = renameCollectionOptions
		}
		return options
	}

	Public.bulkWriteOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.BulkWriteOptions)) {
			var bulkWriteOptions = new com.mongodb.client.model.BulkWriteOptions()
			Public.applyOptions(renameCollectionOptions, options, ['ordered'])
			options = bulkWriteOptions
		}
		return options
	}
	
	// Behavior
	
	Public.readPreference = function(options) {
		if ((options.mode != 'primary') && (options.mode != 'primaryPreferred') && (options.mode != 'secondary') && (options.mode != 'secondaryPreferred') && (options.mode != 'nearest')) {
			throw new MongoError('Unsupported read preference: ' + options.mode)
		}
		
		var readPreference
		
		if (Public.exists(options.tags)) {
			var tagList = new java.util.ArrayList()
			for (var name in options.tags) {
				var value = options.tags[value]
				tagList.add(new com.mongodb.Tag(name, value))
			}
			var tagSet = new com.mongodb.TagSet(tagList) 
			readPreference = com.mongodb.ReadPreference[options.mode](tagSet)
		}
		else {
			readPreference = com.mongodb.ReadPreference[options.mode]()
		}
		
		return readPreference
	}
	
	Public.writeConcern = function(options) {
		var w = Public.exists(options.w) ? options.w : 0
		var wtimeout = Public.exists(options.wtimeout) ? options.wtimeout : 0
		var fsync = Public.exists(options.fsync) ? options.fsync : false
		var j = Public.exists(options.j) ? options.j : false
		return new com.mongodb.WriteConcern(w, wtimeout, fsync, j)
	}
	
	// Models

	Public.writeModel = function(model) {
		if (!(model instanceof com.mongodb.client.model.WriteModel)) {
			switch (model.type) {
			case 'deleteMany':
				model = new com.mongodb.client.model.DeleteManyModel(model.filter)
				break
			case 'deleteOne':
				model = new com.mongodb.client.model.DeleteOneModel(model.filter)
				break
			case 'insertOne':
				model = new com.mongodb.client.model.InsertOneModel(model.document)
				break
			case 'replaceOne':
				var filter = model.filter
				var replacement = model.replacement
				if (!Public.exists(model.options)) {
					model = new com.mongodb.client.model.ReplaceOneModel(filter, replacement)
				}
				else {
					var options = Public.updateOptions(model.options)
					model = new com.mongodb.client.model.ReplaceOneModel(filter, replacement, options)
				}
				break
			case 'updateMany':
				var filter = model.filter
				var update = model.update
				if (!Public.exists(model.options)) {
					model = new com.mongodb.client.model.UpdateManyModel(filter, update)
				}
				else {
					var options = Public.updateOptions(model.options)
					model = new com.mongodb.client.model.UpdateManyModel(filter, update, options)
				}
				break
			case 'updateOne':
				var filter = model.filter
				var update = model.update
				if (!Public.exists(model.options)) {
					model = new com.mongodb.client.model.UpdateOneModel(filter, update)
				}
				else {
					var options = Public.updateOptions(model.options)
					model = new com.mongodb.client.model.UpdateOneModel(filter, update, options)
				}
				break
			default:
				throw new MongoException('Unsupported write model type: ' + model.type)
			}
		}
		return model
	}

	// Results

	Public.deleteResult = function(result) {
		var deleteResult = {
			wasAcknowledged: result.wasAcknowledged()
		}
		if (deleteResult.wasAcknowledged) {
			deleteResult.deletedCount = result.deletedCount
		}
		return deleteResult
	}
	
	Public.updateResult = function(result) {
		var updateResult = {
			wasAcknowledged: result.wasAcknowledged()
		}
		if (updateResult.wasAcknowledged) {
			updateResult.modifiedCountAvailable = result.modifiedCountAvailable
			if (updateResult.modifiedCountAvailable) {
				updateResult.modifiedCount = result.modifiedCount
			}
			updateResult.matchedCount = result.matchedCount
			updateResult.upsertedId = result.upsertedId
		}
		return updateResult
	}

	Public.bulkWriteResult = function(result) {
		var bulkWriteResult = {
			wasAcknowledged: result.wasAcknowledged()
		}
		if (bulkWriteResult.wasAcknowledged) {
			bulkWriteResult.modifiedCountAvailable = result.modifiedCountAvailable
			if (bulkWriteResult.modifiedCountAvailable) {
				bulkWriteResult.modifiedCount = result.modifiedCount
			}
			bulkWriteResult.deletedCount = result.deletedCount
			bulkWriteResult.insertedCount = result.insertedCount
			var upserts = result.upserts
			if (Public.exists(upserts)) {
				bulkWriteResult.upserts = []
				var i = upserts.iterator()
				while (i.hasNext()) {
					var upsert = i.next()
					bulkWriteResult.upserts.push({
						id: upsert.id,
						index: upsert.index
					})
				}
			}
		}
		return bulkWriteResult
	}
	
	// Iterables

	Public.distinctIterable = function(i, options) {
		Public.applyOptions(i, options, ['batchSize'])
		if (Public.exists(options.filter)) {
			i.filter(com.mongodb.jvm.Bson.to(options.filter))
		}
		if (Public.exists(options.maxTime)) {
			i.maxTime(options.maxTime, java.util.concurrent.TimeUnit.MILLISECONDS)
		}
	}
	
	Public.findIterable = function(i, options) {
		Public.applyOptions(i, options, ['batchSize', 'limit', 'noCursorTimeout', 'oplogReplay', 'partial', 'skip'])
		if (Public.exists(options.cursorType)) {
			if (options.cursorType instanceof com.mongodb.CursorType) {
				i.cursorType(options.cursorType)
			}
			else {
				switch (options.cursorType) {
				case 'nonTailable':
					i.cursorType(com.mongodb.CursorType.NonTailable)
					break
				case 'tailable':
					i.cursorType(com.mongodb.CursorType.Tailable)
					break
				case 'tailableAwait':
					i.cursorType(com.mongodb.CursorType.TailableAwait)
					break
				default:
					throw new MongoException('Unsupported cursor type: ' + options.cursorType)
				}
			}
		}
		if (Public.exists(options.filter)) {
			i.filter(com.mongodb.jvm.Bson.to(options.filter))
		}
		if (Public.exists(options.maxTime)) {
			i.maxTime(options.maxTime, java.util.concurrent.TimeUnit.MILLISECONDS)
		}
		if (Public.exists(options.modifiers)) {
			i.modifiers(com.mongodb.jvm.Bson.to(options.modifiers))
		}
		if (Public.exists(options.projection)) {
			i.projection(com.mongodb.jvm.Bson.to(options.projection))
		}
		if (Public.exists(options.sort)) {
			i.sort(com.mongodb.jvm.Bson.to(options.sort))
		}
	}

	Public.mongoIterable = function(i, options) {
		Public.applyOptions(i, options, ['batchSize'])
	}

	Public.listIndexesIterable = function(i, options) {
		Public.applyOptions(i, options, ['batchSize'])
		if (Public.exists(options.maxTime)) {
			i.maxTime(options.maxTime, java.util.concurrent.TimeUnit.MILLISECONDS)
		}
	}

	Public.aggregateIterable = function(i, options) {
		Public.applyOptions(i, options, ['allowDiskUse', 'batchSize', 'useCursor'])
		if (Public.exists(options.maxTime)) {
			i.maxTime(options.maxTime, java.util.concurrent.TimeUnit.MILLISECONDS)
		}
	}

	return Public
}()

// Initialize BSON and extended JSON conversion
if (executable.context.adapter.attributes.get('name') == 'Rhino') {
	com.mongodb.jvm.BSON.implementation = new com.mongodb.jvm.rhino.RhinoBsonImplementation()
	com.threecrickets.jvm.json.JSON.implementation = new com.mongodb.jvm.rhino.MongoRhinoJsonImplementation()
}
else {
	com.mongodb.jvm.BSON.implementation = new com.mongodb.jvm.nashorn.NashornBsonImplementation()
	com.threecrickets.jvm.json.JSON.implementation = new com.mongodb.jvm.nashorn.MongoNashornJsonImplementation()
}

}