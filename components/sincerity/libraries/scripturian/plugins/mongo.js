
document.require(
	'/mongodb/',
	'/sincerity/json/')

function getInterfaceVersion() {
	return 1
}

function getCommands() {
	return ['mongotest']
}

function run(command) {
	switch (String(command.name)) {
		case 'mongotest':
			mongotest(command)
			break
	}
}

function mongotest(command) {
	command.sincerity.out.println('Testing MongoDB driver')
	
	try {
		// Connections
		var client = MongoClient.connect('mongodb://localhost:27017', {description: 'test'})
		command.sincerity.out.println('Client: ' + client.description)

		var db = MongoClient.connect('mongodb://localhost:27017/test')
		command.sincerity.out.println('Database: ' + db.name)

		var collection = MongoClient.connect('mongodb://localhost:27017/test.test')
		command.sincerity.out.println('Collection: ' + collection.fullName)

		// BSON
		var bson = BSON.to({greeting: 'hello'})
		command.sincerity.out.println('BSON.to: ' + bson)
		command.sincerity.out.println('BSON.from: ' + Sincerity.JSON.to(BSON.from(bson)))

		// Databases
		command.sincerity.out.println('Databases:')
		var databases = client.databases()
		for (var d in databases) {
			command.sincerity.out.println('  ' + databases[d].name)
		}

		// Collections
		command.sincerity.out.println('Collections in ' + db.name + ':')
		var collections = db.collections()
		for (var c in collections) {
			command.sincerity.out.println('  ' + collections[c].name)
		}
		
		// Commands
		command.sincerity.out.println('Ping command: ' + Sincerity.JSON.to(db.command({ping: 1}, {mode: 'primary'})))
		
		// Create collection
		try {
			db.createCollection('test2', {maxDocuments: 10})
		}
		catch (e) {
			if (e.code != -1) {
				throw e
			}
		}

		// Indexes
		collection.createIndex('name', {unique: true})
		command.sincerity.out.println('Indexes in ' + collection.fullName + ':')
		var indexes = collection.indexes()
		for (var i in indexes) {
			command.sincerity.out.println('  ' + Sincerity.JSON.to(indexes[i]))
		}
				
		// Documents
		try {
			collection.insertMany([{name: 'Linus'}, {name: 'Richard'}])
		}
		catch (e) {
			if (e.code != -3) {
				throw e
			}
		}
		command.sincerity.out.println('Documents in ' + collection.name + ':')
		for (var cursor = collection.find(); cursor.hasNext(); ) {
			command.sincerity.out.println('  ' + Sincerity.JSON.to(cursor.next()))
		}
	}
	catch (e) {
		if (e instanceof MongoError) {
			command.sincerity.err.println('MongoError:' )
			command.sincerity.err.println('  Message:  ' + e.message)
			command.sincerity.err.println('  Code:     ' + e.code)
			command.sincerity.err.println('  Server:   ' + e.serverAddress)
			command.sincerity.err.println('  Response: ' + Sincerity.JSON.to(e.response))
		}
		else {
			command.sincerity.err.println(e)
		}
	}
}
