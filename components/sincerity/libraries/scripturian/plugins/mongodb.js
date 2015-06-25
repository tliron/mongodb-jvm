
document.require(
	'/mongodb/',
	'/sincerity/json/',
	'/sincerity/objects/')

function getInterfaceVersion() {
	return 1
}

function getCommands() {
	return ['mongo', 'mongotest']
}

function run(command) {
	switch (String(command.name)) {
		case 'mongo':
			mongo(command)
			break
		case 'mongotest':
			mongotest(command)
			break
	}
}

function mongo(command) {
	command.parse = true
	var out = command.sincerity.out
	var adapter = executable.context.adapter.attributes

	out.println('MongoDB JVM shell')
	out.println('JavaScript engine: ' + adapter.get('name') + ' ' + adapter.get('version'))

	if (command.switches.contains('help')) {
		out.println('\
Usage: mongo [uri] [options]\n\
\n\
uri\n\
  A MongoDB connection URI, for example: "mongodb://host:port/database".\n\
  If not provided, the default value will be: "mongodb://localhost/test"/.\n\
  If the "mongodb://" scheme is not provided, it will be prepended\n\
  automatically. If the database is not provided, it will default to "test".\n\
  For documentation, see:\n\
  http://docs.mongodb.org/manual/reference/connection-string/\n\
\n\
options\n\
  --description=shell\n\
    A description of this connection (useful for debugging)\n\
  --readPreference.mode=primary\n\
    primary: read only from the primary.\n\
    primaryPreferred: read from the primary if available, otherwise from a\n\
    secondary.\n\
    secondary: read only from a secondary.\n\
    secondaryPreferred: read from a secondary if available, otherwise from\n\
    the primary.\n\
    nearest: allow reads from either the primary the secondaries.\n\
  --readPreference.tags={}\n\
    The set of tags allowed for selection of secondaries. Not usable for\n\
    \'primary\' mode.\n\
  --writeConcern.w=1\n\
    The write strategy.\n\
    0: Don\'t wait for acknowledgement from the server.\n\
    1: Wait for acknowledgement, but don\'t wait for secondaries to replicate.\n\
    >=2: Wait for one or more secondaries to also acknowledge.\n\
  --writeConcern.wtimeout=0\n\
    How long to wait for slaves before failing.\n\
    0: indefinite.\n\
    >0: time to wait in milliseconds.\n\
  --writeConcern.j=false\n\
    If true block until write operations have been committed to the journal.\n\
    Cannot be used in combination with fsync. Prior to MongoDB 2.6 this option\n\
    was ignored if the server was running without journaling. Starting with\n\
    MongoDB 2.6 write operations will fail with an exception if this option is\n\
    used when the server is running without journaling.\n\
  --writeConcern.fsync=false\n\
    If true and the server is running without journaling, blocks until the\n\
    server has synced all data files to disk. If the server is running with\n\
    journaling, this acts the same as the j option, blocking until write\n\
    operations have been committed to the journal. Cannot be used in\n\
    combination with j. In almost all cases the j flag should be used in\n\
    preference to this one.\n\
  --cursorFinalizerEnabled=true\n\
    Whether there is a a finalize method created that cleans up instances of\n\
    MongoCursor that the client does not close. If you are careful to always\n\
    call the close method of MongoCursor, then this can safely be set to\n\
    false.\n\
  --alwaysUseMBeans=false\n\
    Whether JMX beans registered by the driver should always be MBeans.\n\
  --sslEnabled=false\n\
    Whether to use SSL.\n\
  --sslInvalidHostNameAllowed=false\n\
    Whether invalid host names should be allowed if SSL is enabled. Take care\n\
    before setting this to true, as it makes the application susceptible to\n\
    man-in-the-middle attacks.\n\
  --requiredReplicaSetName=\n\
    The required replica set name. With this option set, the MongoClient\n\
    instance will\n\
    * Connect in replica set mode, and discover all members of the set based\n\
    on the given servers\n\
    * Make sure that the set name reported by all members matches the\n\
    required set name.\n\
    * Refuse to service any requests if any member of the seed list is not\n\
    part of a replica set with the required name.\n\
  --localThreshold=15\n\
    The local threshold. When choosing among multiple MongoDB servers to send\n\
    a request, the MongoClient will only send that request to a server whose\n\
    ping time is less than or equal to the server with the fastest ping time\n\
    plus the local threshold. For example, let\'s say that the client is\n\
    choosing a server to send a query when the read preference is\n\
    \'secondary\', and that there are three secondaries, server1, server2, and\n\
    server3, whose ping times are 10, 15, and 16 milliseconds, respectively.\n\
    With a local threshold of 5 milliseconds, the client will send the query\n\
    to either server1 or server2 (randomly selecting between the two).\n\
  --serverSelectionTimeout=500\n\
    The server selection timeout in milliseconds, which defines how long the\n\
    driver will wait for server selection to succeed before throwing an\n\
    exception. A value of 0 means that it will timeout immediately if no\n\
    server is available. A negative value means to wait indefinitely.\n\
  --minConnectionsPerHost=0\n\
    The minimum number of connections per host for this MongoClient instance.\n\
    Those connections will be kept in a pool when idle, and the pool will\n\
    ensure over time that it contains at least this minimum number.\n\
  --connectionsPerHost=100\n\
    The maximum number of connections allowed per host for this MongoClient\n\
    instance. Those connections will be kept in a pool when idle. Once the\n\
    pool is exhausted, any operation requiring a connection will block waiting\n\
    for an available connection.\n\
  --threadsAllowedToBlockForConnectionMultiplier=5\n\
    This multiplier, multiplied with the connectionsPerHost setting, gives the\n\
    maximum number of threads that may be waiting for a connection to become\n\
    available from the pool. All further threads will get an exception right\n\
    away. For example if connectionsPerHost is 10 and\n\
    threadsAllowedToBlockForConnectionMultiplier is 5, then up to 50 threads\n\
    can wait for a connection.\n\
  --connectTimeout=10000\n\
    The connection timeout in milliseconds. A value of 0 means no timeout. It\n\
    is used solely when establishing a new connection.\n\
  --maxWaitTime=120000\n\
    The maximum wait time in milliseconds that a thread may wait for a\n\
    connection to become available. A value of 0 means that it will not wait.\n\
    A negative value means to wait indefinitely.\n\
  --maxConnectionIdleTime=0\n\
    The maximum idle time of a pooled connection. A zero value indicates no\n\
    limit to the idle time. A pooled connection that has exceeded its idle\n\
    time will be closed and replaced when necessary by a new connection.\n\
  --maxConnectionLifeTime=0\n\
    The maximum life time of a pooled connection. A zero value indicates no\n\
    limit to the life time. A pooled connection that has exceeded its life\n\
    time will be closed and replaced when necessary by a new connection.\n\
  --socketKeepAlive=false\n\
    This flag controls the socket keep alive feature that keeps a connection\n\
    alive through firewalls.\n\
  --minHeartbeatFrequency=500\n\
    Gets the minimum heartbeat frequency. In the event that the driver has to\n\
    frequently re-check a server\'s availability, it will wait at least this\n\
    long since the previous check to avoid wasted effort.\n\
  --heartbeatFrequency=10000\n\
    The heartbeat frequency. This is the frequency that the driver will\n\
    attempt to determine the current state of each server in the cluster.\n\
  --heartbeatConnectTimeout=20000\n\
    The connect timeout for connections used for the cluster heartbeat.\n\
  --heartbeatSocketTimeout=20000\n\
    The socket timeout for connections used for the cluster heartbeat.\n\
  --socketTimeout=0\n\
    The socket timeout in milliseconds. It is used for I/O socket read and\n\
    write operations. 0 means no timeout.')
		java.lang.System.exit(0)
	}
	
	// URI
	var uri
	if (command.arguments.length == 1) {
		uri = command.arguments[0]
		if (!Sincerity.Objects.startsWith(uri, 'mongodb://')) {
			uri = 'mongodb://' + uri
		}
	}
	
	// Options
	var options = {
		description: 'shell',
		serverSelectionTimeout: 5000
	}
	var properties = command.properties
	MongoUtil.clientOptionsFromStringMap(properties, options)

	// Connection message
	out.println('Connecting to: ' + uri)
	out.println('Options: ' + Sincerity.JSON.to(options))

	// Logging
	try {
		sincerity.run(['logging:logging'])
	}
	catch (x) {
		// If logging is not configured, at least avoid annoying log messages to the console
		java.util.logging.Logger.getLogger('').level = java.util.logging.Level.WARNING
	}

	// Connect
	var client, db = null
	try {
		client = new MongoClient(uri, options)
		application.globals.put('mongoDb.client', client)
		client = MongoClient.global()

		var databaseName = client.uri.database
		if (databaseName === null) {
			databaseName = 'test'
		}
		use(databaseName)
		
		var admin = client.database('admin')
		var warnings = admin.admin.getLog('startupWarnings')
		if (Sincerity.Objects.exists(warnings) && Sincerity.Objects.exists(warnings.log) && (warnings.log.length > 0)) {
			out.println('Server has startup warnings:')
			for (var w in warnings.log) {
				out.println(warnings.log[w])
			}
		}
	}
	catch (x) {
		command.sincerity.err.println(MongoError.represent(x, true))
		java.lang.System.exit(0)
	}

	var jline = Packages.jline
	importClass(
		jline.TerminalFactory,
		jline.console.ConsoleReader,
		jline.console.UserInterruptException,
		com.mongodb.jvm.jline.InitialCompleter,
		com.mongodb.jvm.jline.PropertyCompleter)
	
	var evalPropertyCompleter = new JavaAdapter(PropertyCompleter, {
		getCandidatesFor: function(value) {
			try {
				value = eval(value)
			}
			catch (x) {
				return []
			}
			
			var candidates = []

			for (var property in value) {
				if (typeof value[property] == 'function') {
					candidates.push(property + '(')
				}
				else {
					candidates.push(property)
				}
			}

			return candidates
		}
	})

	var terminal = TerminalFactory.create()
	var console = new ConsoleReader()
	var showIndent = false, showMax = 20, showAll = false, showStackTrace = false
	out = console

	var commands = ['exit', 'help', 'help(', 'show(', 'use(', 'db.', 'client.', 'showIndent', 'showMax', 'showAll', 'showStackTrace']
	console.addCompleter(new InitialCompleter(commands))
	console.addCompleter(evalPropertyCompleter)

	console.handleUserInterrupt = true
	console.prompt = '> '

	// REPL
	while (true) {
		try {
			var line = console.readLine()
			r = eval(line)
			var type = typeof r

			if (r instanceof MongoCursor) {
				try {
					var count = 0
					while (r.hasNext()) {
						out.println(String(Sincerity.JSON.to(r.next(), showIndent)))
						if (++count == showMax) {
							if (r.hasNext()) {
								out.println('...')
							}
							break
						}
					}
				}
				finally {
					r.close()
				}
			}
			else if (type == 'function') {
				// Call all functions (they are commands)
				r()
			}
			else if (MongoUtil.isString(r) || (type == 'boolean') || (type == 'number')) {
				// Print all primitives
				out.println(String(r))
			}
			else if (MongoUtil.exists(r)) {
				// Print dicts that are purely data
				var printable = true
				for (var k in r) {
					if (typeof r[k] == 'function') {
						// TODO Recursive
						printable = false
						break
					}
				}
				if (printable || showAll) {
					out.println(String(Sincerity.JSON.to(r), showIndent))					
				}
			}
		}
		catch (x) {
			if ((x instanceof UserInterruptException) || (x.javaException instanceof UserInterruptException)) {
				exit()
			}
			out.println(MongoError.represent(x, showStackTrace))
		}
	}
	
	function exit() {
		out.println('Bye!')
		client.close()
		terminal.reset()
		java.lang.System.exit(0)
	}
	
	function show(o, indent) {
		if (!MongoUtil.exists(indent)) {
			indent = showIndent
		}
		if (MongoUtil.exists(o)) {
			out.println(String(Sincerity.JSON.to(o, indent)))
		}
	}
	
	function help(o) {
		if (MongoUtil.exists(o)) {
			for (var k in o) {
				if (typeof o[k] == 'function') {
					out.println('.' + k + '()')
				}
				else {
					out.println('.' + k)
				}
			}
		}
		else {
			out.println('Commands:')
			out.println(' exit: exits the shell')
			out.println(' help or help(o): shows this help, or shows specific help about an object')
			out.println(' show(o) or show(o, true): shows the object by encoding it into JSON')
			out.println(' use(name): use a different database for this client')
			out.println()
			out.println('Objects:')
			out.println(' db: access the current MongoDatabase')
			out.println(' client: access the current MongoClient; its current MongoCollections are available as properties')
			out.println()
			out.println('Options:')
			out.println(' showIndent = ' + showIndent + ': whether to indent encoded JSON')
			out.println(' showMax = ' + showMax + ': how many entries to show from returned cursors')
			out.println(' showAll = ' + showAll + ': whether to force showing of all returned results, even those that are not JSON-friendly')
			out.println(' showStackTrace = ' + showStackTrace + ': whether to show the stack trace in case of errors')
		}
	}
	
	function use(name) {
		db = client.database(name)
		db.collectionsToProperties()
		out.println('Using database: ' + db.name)
	}
}

function mongotest(command) {
	command.sincerity.out.println('Testing MongoDB driver')
	
	try {
		// Connections
		command.sincerity.out.println('Connections:')
		
		application.globals.put('mongoDb.client', new MongoClient('mongodb://localhost', {description: 'global'}))

		var global = MongoClient.global()
		if (Sincerity.Objects.exists(global)) {
			command.sincerity.out.println(' Global client: ' + global.description)
		}
		else {
			command.sincerity.out.println(' No global client set')
		}
		global.close()
		
		var client = new MongoClient('mongodb://localhost', {description: 'local'})
		command.sincerity.out.println(' Local client: ' + client.description)

		var db = new MongoDatabase('mongodb://localhost/test', {description: 'database'})
		command.sincerity.out.println(' Database: ' + db.name)
		db.client.close()
		db = client.database('test')
		command.sincerity.out.println(' Database: ' + db.name)

		var collection = new MongoCollection('mongodb://localhost/test.test', {description: 'collection'})
		command.sincerity.out.println(' Collection: ' + collection.fullName)
		collection.client.close()
		collection = client.collection('test.test')
		command.sincerity.out.println(' Collection: ' + collection.fullName)
		collection = db.collection('test')
		command.sincerity.out.println(' Collection: ' + collection.fullName)

		// BSON
		command.sincerity.out.println('\nBSON:')

		var bson = BSON.to({greeting: 'hello'})
		command.sincerity.out.println(' To: ' + bson)
		command.sincerity.out.println(' From: ' + Sincerity.JSON.to(BSON.from(bson)))


		// Databases
		command.sincerity.out.println('\nDatabases:')

		var databases = client.databases()
		for (var d in databases) {
			command.sincerity.out.println(' ' + databases[d].name)
		}

		// Collections
		command.sincerity.out.println('\nCollections:')

		command.sincerity.out.println(' In ' + db.name + ':')
		var collections = db.collections()
		for (var c in collections) {
			command.sincerity.out.println('  ' + collections[c].name)
		}
		
		// Commands
		command.sincerity.out.println('\nCommands:')
		command.sincerity.out.println(' Ping: ' + Sincerity.JSON.to(db.ping()))
		
		// Create collection
		try {
			db.createCollection('test2', {maxDocuments: 10})
		}
		catch (x) {
			if (!x.hasCode(MongoError.COLLECTION_ALREADY_EXISTS)) {
				throw x
			}
		}

		// Indexes
		command.sincerity.out.println('\nIndexes:')
				
		collection.createIndex('name', {unique: true})
		command.sincerity.out.println(' In ' + collection.fullName + ':')
		var indexes = collection.indexes()
		for (var i in indexes) {
			command.sincerity.out.println('  ' + Sincerity.JSON.to(indexes[i]))
		}
		
		// Deletion
		//collection.deleteMany({name: {$exists: true}})
				
		// Create documents
		command.sincerity.out.println('\nCreate documents:')

		try {
			collection.insertOne({name: 'Lennart'})
		}
		catch (x) {
			if (!x.hasCode(MongoError.DUPLICATE_KEY)) {
				throw x
			}
		}
		try {
			collection.insertMany([{name: 'Linus'}, {name: 'Richard'}])
		}
		catch (x) {
			if (!x.hasCode(MongoError.DUPLICATE_KEY)) {
				throw x
			}
		}
		try {
			collection.save({name: 'Mark'})
		}
		catch (x) {
			if (!x.hasCode(MongoError.DUPLICATE_KEY)) {
				throw x
			}
		}
		
		// Find
		command.sincerity.out.println('\nFind:')

		command.sincerity.out.println(' With name:')
		var cursor = collection.find({name: {$exists: true}}, {sort: {name: -1}})
		try {
			while (cursor.hasNext()) {
				command.sincerity.out.println('  ' + Sincerity.JSON.to(cursor.next()))
			}
		}
		finally {
			cursor.close()
		}
		
		// Group
		command.sincerity.out.println('\nGroup:')

		var group = {key: {name: 1}, reduce: function(c, r) { r.first = c.name[0] }, filter: {name: {$exists: true}}}
		command.sincerity.out.println(' By names:' + Sincerity.JSON.to(collection.group(group)))

		// Map-reduce
		command.sincerity.out.println('\nMap-reduce:')
		var map = function() { emit(this.name[0], 1) }
		var reduce = function(name, amounts) { return Array.sum(amounts) }
		command.sincerity.out.println(' How many names per first letter:' + Sincerity.JSON.to(collection.mapReduce({map: map, reduce: reduce, filter: {name: {$exists: true}}})))

		// Explain
		command.sincerity.out.println('\nExplain:')
		
		command.sincerity.out.println(' Find: ' + Sincerity.JSON.to(collection.explain.find()))
		command.sincerity.out.println('\n Count: ' + Sincerity.JSON.to(collection.explain.count({name: {$exists: true}})))
		command.sincerity.out.println('\n Group: ' + Sincerity.JSON.to(collection.explain.group(group)))
		command.sincerity.out.println('\n Delete one: ' + Sincerity.JSON.to(collection.explain.deleteOne({name: 'Linus'})))
		command.sincerity.out.println('\n Delete many: ' + Sincerity.JSON.to(collection.explain.deleteMany({name: {$exists: true}})))
		command.sincerity.out.println('\n Update one: ' + Sincerity.JSON.to(collection.explain.updateOne({name: 'Linus'}, {$set: {name: 'Alex'}})))
		command.sincerity.out.println('\n Update many: ' + Sincerity.JSON.to(collection.explain.updateOne({name: 'Linus'}, {$set: {name: 'Alex'}})))
		
		// Closing
		client.close()
		
		command.sincerity.out.println('\nAll tests succeeded!')
	}
	catch (x) {
		command.sincerity.err.println(MongoError.represent(x, true))
	}
}
