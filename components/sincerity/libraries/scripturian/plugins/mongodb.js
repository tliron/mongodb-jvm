
document.require(
	'/mongodb/',
	'/sincerity/repl/',
	'/sincerity/json/',
	'/sincerity/files/',
	'/sincerity/objects/')

importClass(
	com.mongodb.jvm.jline.InitialCompleter,
	com.mongodb.jvm.jline.PropertyCompleter)

function getInterfaceVersion() {
	return 1
}

function getCommands() {
	return ['mongo']
}

function run(command) {
	switch (String(command.name)) {
		case 'mongo':
			mongo(command)
			break
	}
}

function mongo(command) {
	command.parse = true

	// Welcome
	command.sincerity.out.println('MongoDB JVM console ' + MongoUtil.getVersion())
	var adapter = executable.context.adapter.attributes
	command.sincerity.out.println('JavaScript engine: ' + adapter.get('name') + ' ' + adapter.get('version'))

	if (command.switches.contains('help')) {
		helpCommandLine()
		return
	}
	
	// URI
	var uri
	if (command.arguments.length == 1) {
		uri = command.arguments[0]
	}
	else {
		uri = 'mongodb://localhost/test'
	}
	if (!Sincerity.Objects.startsWith(uri, 'mongodb://')) {
		uri = 'mongodb://' + uri
	}
	
	// Options
	var options = {
		description: 'console',
		serverSelectionTimeout: 5000
	}
	var properties = command.properties
	MongoUtil.clientOptionsFromStringMap(properties, options)

	// Connection message
	command.sincerity.out.println('Connecting to: ' + uri)
	command.sincerity.out.println('Client options: ' + Sincerity.JSON.to(options))

	// Logging
	try {
		command.sincerity.run(['logging:logging'])
	}
	catch (x) {
		// If logging is not configured, at least avoid annoying log messages to the console
		java.util.logging.Logger.getLogger('').level = java.util.logging.Level.WARNING
	}

	// Connect
	var client, db = null
	try {
		client = new MongoClient(uri, options)
		client.collectionsToProperties = true

		application.globals.put('mongoDb.client', client)
		client = MongoClient.global()
		
		var databaseName = client.uri.database
		if (databaseName === null) {
			databaseName = 'test'
		}
		db = client.database(databaseName)
		command.sincerity.out.println('Using database: ' + db.name)
	}
	catch (x) {
		command.sincerity.err.println(MongoError.represent(x, true))
		return
	}

	// Admin
	var admin = client.admin
	try {
		admin = admin.admin
		var warnings = admin.getLog('startupWarnings')
		if (Sincerity.Objects.exists(warnings) && Sincerity.Objects.exists(warnings.log) && (warnings.log.length > 0)) {
			command.sincerity.out.println('Server has startup warnings:')
			for (var w in warnings.log) {
				command.sincerity.out.println(warnings.log[w])
			}
		}
	}
	catch (x) {
		command.sincerity.err.println(MongoError.represent(x))
	}

	// Script parameter?
	var script = properties.get('script')
	if (Sincerity.Objects.exists(script)) {
		script = Sincerity.Files.loadText(script)
		try {
			eval(String(script))
		}
		catch (x) {
			command.sincerity.out.println(MongoError.represent(x, true))
		}
		client.close()
		return
	}

	// REPL
	var Mongo = Sincerity.Classes.define(function() {
	    var Public = {}
	    
	    Public._inherit = Sincerity.REPL
	
	    Public._construct = function() {
	    	try {
	    		arguments.callee.overridden.call(this, command.sincerity.container.getCacheFile(['mongodb', 'mongo.history']))
	    	}
	    	catch (x) {
	    		arguments.callee.overridden.call(this)
	    	}
	    	this.showMax = 20
	    }
	
	    Public.initialize = function() {
	    	arguments.callee.overridden.call(this)
	    	var commands = ['exit', 'help', 'help(', 'use(', 'show(', 'reset', 'db.', 'admin.', 'client.', 'this.showIndent', 'this.showMax', 'this.showStackTrace']

	    	var evalPropertyCompleter = new JavaAdapter(PropertyCompleter, {
	    		getCandidatesFor: function(value) {
	    			try {
	    				value = eval(String(value)) // Rhino requires a string
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

	    	this.console.addCompleter(new InitialCompleter(commands))
	    	this.console.addCompleter(evalPropertyCompleter)
	    }
	    
	    Public.finalize = function() {
	    	command.sincerity.out.println('Bye!')
	    }
	
	    Public.evaluate = function(line) {
	    	return eval(line)
	    }
	    
	    Public.onError = function(x) {
			this.out.println(MongoError.represent(x, this.showStackTrace))
	    }
		
		Public.use = function(name) {
			db = client.database(name)
			this.out.println('Using database: ' + db.name)
		}

		Public.help = function(o) {
			if (Sincerity.Objects.exists(o)) {
				for (var k in o) {
					if (typeof o[k] == 'function') {
						this.out.println('.' + k + '()')
					}
					else {
						this.out.println('.' + k)
					}
				}
			}
			else {
				this.out.println('\
Commands:\n\
 exit: exits the shell\n\
 help or help(o): shows this help, or shows specific help about an object\n\
 use(name): use a different database for this client\n\
 show(o) or show(o, true): shows the object by encoding it into JSON\n\
 reset: reset command history\n\
\n\
Objects:\n\
 db: the current MongoDatabase; its current MongoCollections are available as properties\n\
 client: the current MongoClient\n\
 admin: admin commands (shortcut to \'client.admin.admin\')\n\
\n\
Settings:\n\
 this.showIndent = ' + this.showIndent + ': whether to indent encoded JSON\n\
 this.showMax = ' + this.showMax + ': how many entries to show from returned cursors\n\
 this.showStackTrace = ' + this.showStackTrace + ': whether to show the stack trace in case of errors')
			}
		}

		Public.show = function(o, indent) {
			if (o instanceof MongoCursor) {
				this.out.println('Iterating MongoCursor:')
				try {
					var count = 0
					if (!Sincerity.Objects.exists(indent)) {
						indent = this.showIndent
					}
					while (o.hasNext()) {
						this.out.println(String(Sincerity.JSON.to(o.next(), indent)))
						if (++count == this.showMax) {
							if (o.hasNext()) {
								this.out.println('...')
							}
							break
						}
					}
				}
				finally {
					o.close()
				}
			}
			else {
				return arguments.callee.overridden.call(this, o, indent)
			}
		}

		return Public
	}())

	function exit() {
		repl.exit()
	}
	
	function help(o) {
		repl.help(o)
	}

	function use(name) {
		repl.use(name)
	}
	
	function show(o, indent) {
		repl.show(o, indent)
	}

	function reset() {
		repl.reset()
	}

	function helpCommandLine() {
		command.sincerity.out.println('\
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
general options\n\
  --help\n\
    Shows this help\n\
  --script=path\n\
    Run a script from a file\n\
\n\
connection options\n\
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
	}

	var repl = new Mongo()
	repl.run()
}
