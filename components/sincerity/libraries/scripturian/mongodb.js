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

// Initialize BSON and extended JSON conversion
if (executable.context.adapter.attributes.get('name') == 'Rhino') {
	com.mongodb.jvm.BSON.implementation = new com.mongodb.jvm.rhino.RhinoBsonImplementation()
	com.threecrickets.jvm.json.JSON.implementation = new com.mongodb.jvm.rhino.MongoRhinoJsonImplementation()
}
else {
	com.mongodb.jvm.BSON.implementation = new com.mongodb.jvm.nashorn.NashornBsonImplementation()
	com.threecrickets.jvm.json.JSON.implementation = new com.mongodb.jvm.nashorn.MongoNashornJsonImplementation()
}

var BSON = com.mongodb.jvm.BSON

/**
 * @namespace
 */
var MongoUtil = function() {
	/** @exports Public as MongoUtil */
	var Public = {}
	
	Public.id = function() {
		return new org.bson.types.ObjectId()
	}

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

	Public.getGlobal = function(name, application, component) {
		var fullName = 'mongoDb.' + name
		var value = null
		// In Prudence initialization scripts
		try {
			value = app.globals.mongoDb[name]
		}
		catch (x) {}
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
		// In Scripturian
		if (!Public.exists(value)) {
			try {
				value = application.globals.get(fullName)
			}
			catch (x) {}
		}
		if (!Public.exists(value)) {
			try {
				value = application.sharedGlobals.get(fullName)
			}
			catch (x) {}
		}
		// In Prudence
		if (!Public.exists(value)) {
			try {
				value = component.context.attributes.get(fullName)
			}
			catch (x) {}
		}
		return value
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
		return options
	}
	
	Public.createCollectionOptions = function(options) {
		if (!(options instanceof com.mongodb.client.model.CreateCollectionOptions)) {
			var createCollectionOptions = new com.mongodb.client.model.CreateCollectionOptions()
			Public.applyOptions(createCollectionOptions, options, ['autoIndex', 'capped', 'maxDocuments', 'sizeInBytes', 'usePowerOf2Sizes'])
			if (Public.exists(options.storageEngineOptions)) {
				createCollectionOptions.storageEngineOptions(BSON.to(options.storageEngineOptions))
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
				countOptions.hint(BSON.to(options.hint))
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
				indexOptions.storageEngine(BSON.to(options.expireAfter))
			}
			if (Public.exists(options.weights)) {
				indexOptions.weights(BSON.to(options.weights))
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
				findOneAndDeleteOptions.projection(BSON.to(options.projection))
			}
			if (Public.exists(options.sort)) {
				findOneAndDeleteOptions.sort(BSON.to(options.sort))
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
				findOneAndReplaceOptions.projection(BSON.to(options.projection))
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
				findOneAndReplaceOptions.sort(BSON.to(options.sort))
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
				findOneAndUpdateOptions.projection(BSON.to(options.projection))
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
				findOneAndUpdateOptions.sort(BSON.to(options.sort))
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
	
	Public.writeConcern = function(options) {
		var w = Public.exists(options.w) ? options.w : 0
		var wtimeout = Public.exists(options.wtimeout) ? options.wtimeout : 0
		var fsync = Public.exists(options.fsync) ? options.fsync : false
		var j = Public.exists(options.j) ? options.j : false
		return new com.mongodb.WriteConcern(w, wtimeout, fsync, j)
	}

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
			updateResult.upsertedId = BSON.from(result.upsertedId)
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
				for (var i = upserts.iterator(); i.hasNext(); ) {
					var upsert = i.next()
					bulkWriteResult.upserts.push({
						id: BSON.from(upsert.id),
						index: upsert.index
					})
				}
			}
		}
		return bulkWriteResult
	}

	Public.distinctIterable = function(i, options) {
		Public.applyOptions(i, options, ['batchSize'])
		if (Public.exists(options.filter)) {
			i.filter(BSON.to(options.filter))
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
			i.filter(BSON.to(options.filter))
		}
		if (Public.exists(options.maxTime)) {
			i.maxTime(options.maxTime, java.util.concurrent.TimeUnit.MILLISECONDS)
		}
		if (Public.exists(options.modifiers)) {
			i.modifiers(BSON.to(options.modifiers))
		}
		if (Public.exists(options.projection)) {
			i.projection(BSON.to(options.projection))
		}
		if (Public.exists(options.sort)) {
			i.sort(BSON.to(options.sort))
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

	return Public
}()

/**
 * @class
 */
var MongoError = function(x) {
	if (x instanceof com.mongodb.MongoCommandException) {
		this.code = x.code
		this.message = x.message
		this.serverAddress = String(x.serverAddress)
		this.response = BSON.from(x.response)
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
				details: BSON.from(writeConcern.details)
			}
		}
		var writeErrors = x.writeErrors
		if (MongoUtil.exists(writeErrors)) {
			this.writeErrors = []
			for (var i = writeErrors.iterator(); i.hasNext(); ) {
				var writeError = i.next()
				this.writeErrors.push({
					index: writeError.index,
					code: writeError.code,
					message: writeError.message,
					category: String(writeError.category),
					details: BSON.from(writeError.details)
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
		this.cause = x
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
		return MongoUtil.prune(this, ['code', 'message', 'serverAddress', 'response', 'writeConcern', 'writeErrors', 'writeResult', 'cause'])
	}
}

/** @constant */
MongoError.GONE = -2
/** @constant */
MongoError.NOT_FOUND = -5
/** @constant */
MongoError.CAPPED = 10003
/** @constant */
MongoError.DUPLICATE_KEY = 11000
/** @constant */
MongoError.DUPLICATE_KEY_ON_UPDATE = 11001

/**
 * @class
 */
var MongoClient = function(client) {
	this.client = client
	
	this.description = this.client.mongoClientOptions.description
	
	/**
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 */
	this.databases = function(options) {
		try {
			var databases = []
			var i = this.client.listDatabaseNames().iterator()
			if (MongoUtil.exists(options)) {
				MongoUtil.mongoIterable(i, options)
			}
			while (i.hasNext()) {
				databases.push(this.database(i.next()))
			}
			return databases
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	this.database = this.db = function(name) {
		try {
			return new MongoDatabase(this.client.getDatabase(name), this)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
}

/**
 * @param {String|com.mongodb.MongoClientURI} [uri='mongodb://localhost:27017/test']
 * @param {Object|com.mongodb.MongoClientOptions.Builder} [options]
 * @param {Boolean} [options.alwaysUseMBeans]
 * @param {Number} [options.connectionsPerHost]
 * @param {Number} [options.connectTimeout]
 * @param {Boolean} [options.cursorFinalizerEnabled]
 * @param {String} [options.description]
 * @param {Number} [options.heartbeatConnectTimeout]
 * @param {Number} [options.heartbeatFrequency]
 * @param {Number} [options.heartbeatSocketTimeout]
 * @param {Number} [options.localThreshold]
 * @param {Number} [options.maxConnectionIdleTime]
 * @param {Number} [options.maxConnectionLifeTime]
 * @param {Number} [options.maxWaitTime]
 * @param {Number} [options.minConnectionsPerHost]
 * @param {Number} [options.minHeartbeatFrequency]
 * @param {Object} [options.readPreference]
 * @param {String} [options.readPreference.mode] 'primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', or 'nearest'
 * @param {Object} [options.readPreference.tags]
 * @param {String} [options.requiredReplicaSetName]
 * @param {Number} [options.serverSelectionTimeout]
 * @param {Number} [options.socketKeepAlive]
 * @param {Number} [options.socketTimeout]
 * @param {Boolean} [options.sslEnabled]
 * @param {Boolean} [options.sslInvalidHostNameAllowed]
 * @param {Number} [options.threadsAllowedToBlockForConnectionMultiplier]
 * @param {Object} [options.writeConcern]
 * @param {Number} [options.writeConcern.w] Number of writes
 * @param {Number} [options.writeConcern.wtimeout] Timeout for writes
 * @param {Boolean} [options.writeConcern.fsync] Whether writes should wait for fsync
 * @param {Boolean} [options.writeConcern.j] Whether writes should wait for a journaling group commit
 */
MongoClient.connect = function(uri, options) {
	try {
		if (!uri) {
			uri = 'mongodb://localhost:27017/test'
		}
		if (!(uri instanceof com.mongodb.MongoClientURI)) {
			if (MongoUtil.exists(options)) {
				options = MongoUtil.clientOptions(options)
				uri = new com.mongodb.MongoClientURI(uri, options)
			}
			else {
				uri = new com.mongodb.MongoClientURI(uri)
			}
		}
		var client = new com.mongodb.MongoClient(uri)
		client = new MongoClient(client)
		if (!MongoUtil.exists(uri.database)) {
			return client
		}
		var database = client.database(uri.database)
		if (!MongoUtil.exists(uri.collection)) {
			return database
		}
		return database.collection(uri.collection)
	}
	catch (x) {
		throw new MongoError(x)
	}
}

/**
 * 
 */
MongoClient.global = function(application, component) {
	var client = MongoUtil.getGlobal('client', application, component)
	if (!MongoUtil.exists(client)) {
		var uri =  MongoUtil.getGlobal('uri', application, component)
		var options =  MongoUtil.getGlobal('options', application, component)
		if (MongoUtil.exists(uri)) {
			client = MongoClient.connect(uri, options)
			// In Prudence
			client = application.getGlobal('mongoDb.client', client)
			try {
				// In Prudence initialization scripts
				app.globals.mongoDb = app.globals.mongoDb || {}
				app.globals.mongoDb.client = Public.client
			}
			catch (x) {}
		}
	}
	return client
}

/**
 * @class
 */
var MongoDatabase = function(database, client) {
	this.database = database
	this.client = client
	
	this.name = this.database.name

	/*this.addUser = function(username, password, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.admin = function() {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.authenticate = function(username, password, options, callback) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.close = function(force) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/**
	 * @param {String} name
	 */
	this.collection = function(name) {
		try {
			var collection = this.database.getCollection(name)
			return new MongoCollection(collection, this.client)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 */
	this.collections = function(options) {
		try {
			var collections = []
			var i = this.database.listCollectionNames().iterator()
			if (MongoUtil.exists(options)) {
				MongoUtil.mongoIterable(i, options)
			}
			while (i.hasNext()) {
				collections.push(this.collection(i.next()))
			}
			return collections
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
	this.command = function(command, options) {
		try {
			var result
			command = BSON.to(command)
			if (!MongoUtil.exists(options)) {
				result = this.database.runCommand(command)				
			}
			else {
				options = MongoUtil.readPreference(options)
				result = this.database.runCommand(command, options)
			}
			return BSON.from(result)
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
	
	/*this.createIndex = function(name, fieldOrSpec, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.db = function() {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.dropCollection = function(name) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	this.drop = function() {
		try {
			this.database.drop()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	/*this.eval = function(code, parameters, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.executeDbAdminCommand = function(command, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.indexInformation = function(name, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.logout = function(options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.open = function() {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.removeUser = function(username, options) {		
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.renameCollection = function(fromCollection, toCollection, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/*this.stats = function(options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/
	
	/**
	 * @param {Object} [options]
	 * @param {String} [options.mode] 'primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', or 'nearest'
	 * @param {Object} [options.tags]
	 */
	this.withReadPreference = function(options) {
		var readPreference = MongoUtil.readPreference(options)
		return new MongoDatabase(this.database.withReadPreference(readPreference), this.client)
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.w] Number of writes
	 * @param {Number} [options.wtimeout] Timeout for writes
	 * @param {Boolean} [options.fsync] Whether writes should wait for fsync
	 * @param {Boolean} [options.j] Whether writes should wait for a journaling group commit
	 */
	this.withWriteConcern = function(options) {
		var writeConcern = MongoUtil.writeConcern(options)
		return new MongoDatabase(this.database.withWriteConcern(writeConcern), this.client)
	}
}

/**
 * @class
 */
var MongoCollection = function(collection, client) {
	this.collection = collection
	this.client = client
	
	this.name = this.collection.namespace.collectionName
	this.databaseName = this.collection.namespace.databaseName
	this.fullName = this.collection.namespace.fullName
	
	this.aggregate = function(pipeline) {
		try {
			var i = this.collection.aggregate(BSON.to(pipeline))
			// TODO
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.bulkWrite = function(operations, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

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
				filter = BSON.to(filter)
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
			spec = BSON.to(spec)
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

	this.createIndexes = function(indexSpecs) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * 
	 */
	this.deleteMany = function(filter) {
		try {
			var result = this.collection.deleteMany(BSON.to(filter))
			return MongoUtil.deleteResult(result)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.deleteOne = function(filter) {
		try {
			var result = this.collection.deleteOne(BSON.to(filter))
			return MongoUtil.deleteResult(result)
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

	this.drop = function() {
		try {
			this.collection.drop()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.dropIndex = function(fieldOrSpec) {
		try {
			if (MongoUtil.isString(fieldOrSpec)) {
				this.collection.dropIndex(fieldOrSpec)
			}
			else {
				this.collection.dropIndex(BSON.to(fieldOrSpec))
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
				i = this.collection.find(BSON.to(filter))
			}
			return new MongoCursor(i, options)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.findOne = function(filter, options) {
		try {
			return find(filter, options).first()
			// TODO
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
			filter = BSON.to(filter)
			if (!MongoUtil.exists(options)) {
				result = this.collection.findOneAndDelete(filter)
			}
			else {
				options = MongoUtil.findOneAndDeleteOptions(options)
				result = this.collection.findOneAndDelete(filter, options)
			}
			return BSON.from(result)
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
			filter = BSON.to(filter)
			replacement = BSON.to(replacement)
			if (!MongoUtil.exists(options)) {
				result = this.collection.findOneAndReplace(filter, replacement)
			}
			else {
				options = MongoUtil.findOneAndReplaceOptions(options)
				result = this.collection.findOneAndReplace(filter, replacement, options)
			}
			return BSON.from(result)
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
			filter = BSON.to(filter)
			update = BSON.to(update)
			if (!MongoUtil.exists(options)) {
				result = this.collection.findOneAndUpdate(filter, update)
			}
			else {
				options = MongoUtil.findOneAndUpdateOptions(options)
				result = this.collection.findOneAndUpdate(filter, update, options)
			}
			return BSON.from(result)
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/*this.geoHaystackSearch = function(x, y, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/

	/*this.geoNear = function(x, y, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/

	/*this.group = function(keys, condition, initial, reduce, finalize, command, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.batchSize]
	 * @param {Number} [options.maxTime]
	 */
	this.indexes = function(options) {
		try {
			var indexes = []
			var i = this.collection.listIndexes().iterator()
			if (MongoUtil.exists(options)) {
				MongoUtil.listIndexesIterable(i, options)
			}
			while (i.hasNext()) {
				indexes.push(BSON.from(i.next()))
			}
			return indexes
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.indexExists = function(indexes) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.indexInformation = function(options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.initializeOrderedBulkOp = function(options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.initializeUnorderedBulkOp = function(options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object[]} [docs]
	 * @param {Object} [options]
	 * @param {Boolean} [options.ordered]
	 */
	this.insertMany = function(docs, options) {
		try {
			var list = new java.util.ArrayList(docs.length)
			for (var d in docs) {
				list.add(BSON.to(docs[d]))
			}
			if (!MongoUtil.exists(options)) {
				this.collection.insertMany(list)
			}
			else {
				options = MongoUtil.insertManyOptions(options)
				this.collection.insertMany(list, options)
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
			this.collection.insertOne(BSON.to(doc))
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.isCapped = function() {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/*this.listIndexes = function(options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/

	this.mapReduce = function(map, reduce, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.options = function() {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.parallelCollectionScan = function(options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.reIndex = function() {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	this.rename = function(newName, options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}

	/**
	 * @param {Object} [filter]
	 * @param {Object} [replacement]
	 * @param {Object} [options]
	 * @param {Boolean} [options.upsert]
	 */
	this.replaceOne = function(filter, replacement, options) {
		try {
			filter = BSON.to(filter)
			replacement = BSON.to(replacement)
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
	 * Update an existing document or, if it doesn't exist, inserts it.
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
		try {
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
		catch (x) {
			throw new MongoError(x)
		}
	}

	/*this.stats = function(options) {
		try {
		}
		catch (x) {
			throw new MongoError(x)
		}
	}*/

	/**
	 * @param {Object} [filter]
	 * @param {Object} [update]
	 * @param {Object} [options]
	 * @param {Boolean} [options.upsert]
	 */
	this.updateMany = function(filter, update, options) {
		try {
			filter = BSON.to(filter)
			update = BSON.to(update)
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
			filter = BSON.to(filter)
			update = BSON.to(update)
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
	 * @param {String} [options.mode] 'primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', or 'nearest'
	 * @param {Object} [options.tags]
	 */
	this.withReadPreference = function(options) {
		var readPreference = MongoUtil.readPreference(options)
		return new MongoCollection(this.collection.withReadPreference(readPreference), this.client)
	}

	/**
	 * @param {Object} [options]
	 * @param {Number} [options.w] Number of writes
	 * @param {Number} [options.wtimeout] Timeout for writes
	 * @param {Boolean} [options.fsync] Whether writes should wait for fsync
	 * @param {Boolean} [options.j] Whether writes should wait for a journaling group commit
	 */
	this.withWriteConcern = function(options) {
		var writeConcern = MongoUtil.writeConcern(options)
		return new MongoCollection(this.collection.withWriteConcern(writeConcern), this.client)
	}
}

/**
 * @class
 */
var MongoCursor = function(iterable, options) {
	if (MongoUtil.exists(options)) {
		MongoUtil.findIterable(iterable, options)
	}

	this.cursor = iterable.iterator()

	this.hasNext = function() {
		try {
			return this.cursor.hasNext()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	this.next = function() {
		try {
			return BSON.from(this.cursor.next())
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
	
	this.close = function() {
		try {
			this.cursor.close()
		}
		catch (x) {
			throw new MongoError(x)
		}
	}
}

}