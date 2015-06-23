
document.require(
	'/mongodb/',
	'/sincerity/json/',
	'/sincerity/objects/')

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
		application.globals.put('mongoDb.client', MongoClient.connect('mongodb://localhost:27017', {description: 'global'}))

		var global = MongoClient.global(application)
		if (Sincerity.Objects.exists(global)) {
			command.sincerity.out.println('Global client: ' + global.description)
		}
		else {
			command.sincerity.out.println('No global client set')
		}
		
		var client = MongoClient.connect('mongodb://localhost:27017', {description: 'test'})
		command.sincerity.out.println('Local client: ' + client.description)

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
		catch (x) {
			if (x.code != -1) {
				throw x
			}
		}

		// Indexes
		collection.createIndex('name', {unique: true})
		command.sincerity.out.println('Indexes in ' + collection.fullName + ':')
		var indexes = collection.indexes()
		for (var i in indexes) {
			command.sincerity.out.println('  ' + Sincerity.JSON.to(indexes[i]))
		}
				
		// Create documents
		try {
			collection.insertOne({name: 'Lennart'})
		}
		catch (x) {
			if (x.code != 11000) {
				throw x
			}
		}
		try {
			collection.insertMany([{name: 'Linus'}, {name: 'Richard'}])
		}
		catch (x) {
			if (x.code != -3) {
				throw x
			}
		}
		collection.save({name: 'Mark'})
		
		// Find
		command.sincerity.out.println('Documents in ' + collection.name + ' with name:')
		var cursor = collection.find({name: {$exists: true}}, {sort: {name: -1}})
		try {
			while (cursor.hasNext()) {
				command.sincerity.out.println('  ' + Sincerity.JSON.to(cursor.next()))
			}
		}
		finally {
			cursor.close()
		}
		
		command.sincerity.out.println('All tests succeeded!')
	}
	catch (x) {
		if (x instanceof MongoError) {
			command.sincerity.err.println('MongoError:' )
			command.sincerity.err.println('  Message:  ' + x.message)
			command.sincerity.err.println('  Code:     ' + x.code)
			command.sincerity.err.println('  Server:   ' + x.serverAddress)
			command.sincerity.err.println('  Response: ' + Sincerity.JSON.to(x.response))
		}
		else {
			command.sincerity.err.println(x)
		}
	}
}
