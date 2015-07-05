
document.require(
	'/mongodb/',
	'/sincerity/json/',
	'/sincerity/objects/')

println('Testing MongoDB driver')
	
try {
	// Connections
	println('Connections:')
	
	application.globals.put('mongoDb.client', new MongoClient('mongodb://localhost', {description: 'global'}))

	var global = MongoClient.global()
	if (Sincerity.Objects.exists(global)) {
		println(' Global client: ' + global.description)
	}
	else {
		println(' No global client set')
	}
	global.close()
	
	var client = new MongoClient('mongodb://localhost', {description: 'local'})
	println(' Local client: ' + client.description)

	var db = new MongoDatabase('mongodb://localhost/test', {description: 'database'})
	println(' Database: ' + db.name)
	db.client.close()
	db = client.database('test')
	println(' Database: ' + db.name)

	var collection = new MongoCollection('mongodb://localhost/test.test', {description: 'collection'})
	println(' Collection: ' + collection.fullName)
	collection.client.close()
	collection = client.collection('test.test')
	println(' Collection: ' + collection.fullName)
	collection = db.collection('test')
	println(' Collection: ' + collection.fullName)

	// BSON
	println('\nConversions:')

	var data = {greeting: 'hello', now: new Date(), regular: /[c]+/g, array: ['fish', 123]}
	println(' To standard JSON: ' + JSON.stringify(data))
	var extended = Sincerity.JSON.to(data)
	println(' To extended JSON: ' + extended)
	println(' From extended JSON: ' + Sincerity.JSON.to(Sincerity.JSON.from(extended)))
	println(' To BSON: ' + BSON.to(data))


	// Databases
	println('\nDatabases:')

	var databases = client.databases()
	for (var d in databases) {
		println(' ' + databases[d].name)
	}

	// Collections
	println('\nCollections:')

	println(' In ' + db.name + ':')
	var collections = db.collections()
	for (var c in collections) {
		println('  ' + collections[c].name)
	}
	
	// Commands
	println('\nCommands:')
	println(' Ping: ' + Sincerity.JSON.to(db.admin.ping()))
	
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
	println('\nIndexes:')
			
	collection.createIndex('name', {unique: true})
	println(' In ' + collection.fullName + ':')
	var indexes = collection.indexes()
	for (var i in indexes) {
		println('  ' + Sincerity.JSON.to(indexes[i]))
	}
	
	// Deletion
	//collection.deleteMany({name: {$exists: true}})
			
	// Create documents
	println('\nCreate documents:')

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
	println('\nFind:')

	println(' With name:')
	var cursor = collection.find({name: {$exists: true}}, {sort: {name: -1}})
	try {
		while (cursor.hasNext()) {
			println('  ' + Sincerity.JSON.to(cursor.next()))
		}
	}
	finally {
		cursor.close()
	}
	
	// Group
	println('\nGroup:')

	var group = {key: {name: 1}, reduce: function(c, r) { r.first = c.name[0] }, filter: {name: {$exists: true}}}
	println(' By names: ' + Sincerity.JSON.to(collection.group(group)))

	// Map-reduce
	println('\nMap-reduce:')
	var map = function() { emit(this.name[0], 1) }
	var reduce = function(name, amounts) { return Array.sum(amounts) }
	println(' How many names per first letter: ' + Sincerity.JSON.to(collection.mapReduce({map: map, reduce: reduce, filter: {name: {$exists: true}}})))

	// Explain
	println('\nExplain:')
	
	println(' Find: ' + Sincerity.JSON.to(collection.explain.find()))
	println('\n Count: ' + Sincerity.JSON.to(collection.explain.count({name: {$exists: true}})))
	println('\n Group: ' + Sincerity.JSON.to(collection.explain.group(group)))
	println('\n Delete one: ' + Sincerity.JSON.to(collection.explain.deleteOne({name: 'Linus'})))
	println('\n Delete many: ' + Sincerity.JSON.to(collection.explain.deleteMany({name: {$exists: true}})))
	println('\n Update one: ' + Sincerity.JSON.to(collection.explain.updateOne({name: 'Linus'}, {$set: {name: 'Alex'}})))
	println('\n Update many: ' + Sincerity.JSON.to(collection.explain.updateOne({name: 'Linus'}, {$set: {name: 'Alex'}})))
	
	// Closing
	client.close()
	
	println('\nAll tests succeeded!')
}
catch (x) {
	println(MongoError.represent(x, true))
}
