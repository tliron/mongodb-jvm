This project aims to provide full integration between JVM languages and MongoDB. It requires the [Java driver for MongoDB](http://github.com/mongodb/mongo-java-driver).

Currently supported engines:

  * Nashorn/JavaScript
  * Rhino/JavaScript

Original code by Tal Liron. Contributions from Jamie McCrindle.

### Stay Native with BSON ###

We allow conversion to/from native JavaScript objects and MongoDB's BSON. We support JavaScript Date objects, RegExp objects, BSON object IDs, binaries and references. This allows you to use MongoDB API and documents directly from Rhino without textual parsing of JSON.

### High-performance JSON ###

Included is excellent support for JSON using the [JSON JVM library](http://code.google.com/p/json-jvm/), which performs much better than the [JavaScript JSON API](http://www.json.org/js.html).

More importantly, JSON conversion fully supports MongoDB's [extended JSON](http://www.mongodb.org/display/DOCS/Mongo+Extended+JSON). Specifically, we support $oid, $ref, $date, $binary and $regex notations. We've also extended the already-extended JSON by adding a $long notation: this allows transcribing JVM Long instances as strings in JavaScript (which internally uses double primitives) allowing for transfer via JSON without loss of precision.

## Get It ##

To install the JavaScript wrapper (will pull in the JVM binary) via [Sincerity](http://threecrickets.com/sincerity/):
```
sincerity add com.threecrickets.sincerity.library sincerity-mongodb : install
```

You can also download the JavaScript wrapper [here](http://repository.threecrickets.com/maven/com/threecrickets/sincerity/library/sincerity-mongodb/). You can browse the latest JavaScript API documentation [here](http://threecrickets.com/api/javascript/?namespace=MongoDB).

The latest JVM binary and Java API documentation jars are available [here](http://repository.threecrickets.com/maven/com/mongodb/jvm-driver/).

To install the just the JVM binary via Maven:
```
<repository>
    <id>three-crickets</id>  
    <name>Three Crickets Repository</name>  
    <url>http://repository.threecrickets.com/maven/</url>  
</repository>

<dependency>
    <groupId>com.mongodb.jvm-driver</groupId>
    <artifactId>jvm-driver</artifactId>
    <version>[2.1,2.2)</version>
</dependency>
```
Hosted by [Three Crickets](http://threecrickets.com/).


## Examples ##

See [MongoVision](http://code.google.com/p/mongo-vision/) for a complete example application.

Simple example:
```
// The Java driver
importClass(com.mongodb.Mongo)

// BSON conversion
importClass(com.mongodb.jvm.BSON)

// JSON converstion with support for MongoDB extended notation
JSON = com.threecrickets.jvm.json.JSON
JSON.implementation = new com.mongodb.jvm.MongoRhinoJsonImplementation()

var connection = new Mongo()
var db = connection.getDB('mydatabase')
var collection = db.getCollection('mycollection')

var doc = {name: 'hello'}
collection.insert(BSON.to(doc))

var query = {name: 'hello'}
var update = {$push: {anArray: 'aValue'}}
collection.update(BSON.to(query), BSON.to(update), false, false)

var query = {name: /he(.*)/i}
var doc = BSON.from(collection.findOne(BSON.to(query)))
java.lang.System.out.println(JSON.to(doc))
```