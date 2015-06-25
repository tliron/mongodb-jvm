
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
	var jline = Packages.jline
	importClass(
		jline.TerminalFactory,
		jline.console.ConsoleReader,
		jline.console.UserInterruptException,
		com.mongodb.jvm.jline.InitialCompleter,
		com.mongodb.jvm.jline.PropertyCompleter)
	
	var terminal = TerminalFactory.create()
	var console = new ConsoleReader()
	var out = console
	var showIndent = false
	var showMax = 20
	var showAll = false
	var showStackTrace = false

	var commands = ['exit', 'help', 'help(', 'show(', 'db.', 'client.', 'showIndent', 'showMax', 'showAll', 'showStackTrace']
	
	var EvalPropertyCompleter = Java.extend(PropertyCompleter, {
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

	console.addCompleter(new InitialCompleter(commands))
	console.addCompleter(new EvalPropertyCompleter())

	console.handleUserInterrupt = true
	console.prompt = '> '

	application.globals.put('mongoDb.client', new MongoClient('mongodb://localhost:27017', {description: 'shell'}))
	var client = MongoClient.global()
	var db = client.database('test')
	db.collectionsToProperties()

	out.println('MongoDB shell')

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
}

function mongotest(command) {
	command.sincerity.out.println('Testing MongoDB driver')
	
	try {
		// Connections
		command.sincerity.out.println('Connections:')
		
		application.globals.put('mongoDb.client', new MongoClient('mongodb://localhost:27017', {description: 'global'}))

		var global = MongoClient.global()
		if (Sincerity.Objects.exists(global)) {
			command.sincerity.out.println(' Global client: ' + global.description)
		}
		else {
			command.sincerity.out.println(' No global client set')
		}
		global.close()
		
		var client = new MongoClient('mongodb://localhost:27017', {description: 'test'})
		command.sincerity.out.println(' Local client: ' + client.description)

		var db = new MongoDatabase('mongodb://localhost:27017/test')
		command.sincerity.out.println(' Database: ' + db.name)
		db = client.database('test')
		command.sincerity.out.println(' Database: ' + db.name)

		var collection = new MongoCollection('mongodb://localhost:27017/test.test')
		command.sincerity.out.println(' Collection: ' + collection.fullName)
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
		
		command.sincerity.out.println(' Find: ' + Sincerity.JSON.to(collection.explain().find()))
		command.sincerity.out.println('\n Count: ' + Sincerity.JSON.to(collection.explain('queryPlanner').count({name: {$exists: true}})))
		command.sincerity.out.println('\n Group: ' + Sincerity.JSON.to(collection.explain('queryPlanner').group(group)))
		command.sincerity.out.println('\n Delete one: ' + Sincerity.JSON.to(collection.explain('queryPlanner').deleteOne({name: 'Linus'})))
		command.sincerity.out.println('\n Delete many: ' + Sincerity.JSON.to(collection.explain('queryPlanner').deleteMany({name: {$exists: true}})))
		command.sincerity.out.println('\n Update one: ' + Sincerity.JSON.to(collection.explain('queryPlanner').updateOne({name: 'Linus'}, {$set: {name: 'Alex'}})))
		command.sincerity.out.println('\n Update many: ' + Sincerity.JSON.to(collection.explain('queryPlanner').updateOne({name: 'Linus'}, {$set: {name: 'Alex'}})))
		
		// Closing
		client.close()
		
		command.sincerity.out.println('\nAll tests succeeded!')
	}
	catch (x) {
		command.sincerity.err.println(MongoError.represent(x, true))
	}
}
