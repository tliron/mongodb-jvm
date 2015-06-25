
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
		command.sincerity.err.println(MongoError.represent(x))
	}
}
