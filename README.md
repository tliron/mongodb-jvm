
MongoDB JVM
===========

Though the JVM has the [Java MongoDB Driver](http://docs.mongodb.org/ecosystem/drivers/java/),
which can be used by any non-Java language running on the JVM, in practice it is designed for Java
and awkward to use in other languages.

The goal of this project is to supply "wrappers" that allow languages running
on the JVM to use the Java driver with the culture and paradigms appropriate to
that language. It also includes a library to translate directly between BSON and
native language types without going through Java types, as well as an extensible
JSON encoder/decoder, which supports MongoDB
[extended JSON](http://docs.mongodb.org/manual/reference/mongodb-extended-json/) for both
directions.

Currently the project supports JavaScript via both the
[Nashorn](http://openjdk.java.net/projects/nashorn/) and
[Rhino](https://github.com/mozilla/rhino) engines. The wrapper attempts to mimic the
[Node.js MongoDB Driver](http://docs.mongodb.org/ecosystem/drivers/node-js/) while also being true
to the feature set of the Java driver.

Documentation for the JavaScript classes:
[MongoClient](http://threecrickets.com/api/javascript/?namespace=MongoClient),
[MongoDatabase](http://threecrickets.com/api/javascript/?namespace=MongoDatabase),
[MongoCollection](http://threecrickets.com/api/javascript/?namespace=MongoCollection),
[MongoCursor](http://threecrickets.com/api/javascript/?namespace=MongoCursor),
[MongoError](http://threecrickets.com/api/javascript/?namespace=MongoError), and
[MongoUtil](http://threecrickets.com/api/javascript/?namespace=MongoUtil).

As an added bonus, the project comes with a powerful JavaScript shell,
essentially a clone for the JVM of the
[mongo shell](http://docs.mongodb.org/manual/administration/scripting/) that comes with
MongoDB. It can do most anything that mongo can do, while also letting you use
any JVM library from JavaScript. It is itself written in JavaScript, and as such
is very easy to hack and adapt to your particular needs.

To run the shell:

	./sincerity mongo

Add "--help" to see command-line options, and run "help" from within the shell
to see the commands. The shell supports basic TAB-key completion and UP/DOWN-key
persistent history.

You may also be interested in [MongoVision](https://github.com/tliron/mongovision), a web-based
MongoDB administration interface, which is written in JavaScript using this wrapper.

[![Download](http://threecrickets.com/media/download.png "Download")](https://drive.google.com/uc?export=download&id=0B5XU4AmCevRXVWM1QmJPNlIwX1k)

Full install via Sincerity:

    sincerity create mycontainer : attach public three-crickets maven http://repository.threecrickets.com/maven/ : add com.threecrickets.sincerity.library sincerity-mongodb : install

Maven (for BSON/JSON conversion only):

    <repository>
        <id>threecrickets</id>
        <name>Three Crickets Repository</name>
        <url>http://repository.threecrickets.com/maven/</url>
    </repository>
    <dependency>
        <groupId>org.mongodb</groupId>
        <artifactId>mongodb-jvm-driver</artifactId>
    </dependency>


Building MongoDB JVM
--------------------

To *completely* build MongoDB JVM you need [Ant](http://ant.apache.org/),
[Maven](http://maven.apache.org/) and [Sincerity](http://threecrickets.com/sincerity/).

You may need to create a file named "/build/private.properties" (see below) and
override the default locations for Maven and Sincerity.

Then, simply change to the "/build/" directory and run "ant".

Your JDK should be at least version 8 in order to support the Nashorn
implementation, although there is a workaround for earlier JDK versions (see
comment in "/build/custom.properties".)

During the build process, build and distribution dependencies will be
downloaded from an online repository at http://repository.threecrickets.com/, so
you will need Internet access.

The result of the build will go into the "/build/distribution/" directory.
Temporary files used during the build process will go into "/build/cache/",
which you are free to delete.

If you *only* want to build the MongoDB JVM Jar, then you only need Ant (you
don't need Maven and Sincerity). Run the "libraries" Ant target instead of the
default one.


Configuring the Build
---------------------

The "/build/custom.properties" file contains configurable settings, along with
some commentary on what they are used for. You are free to edit that file,
however to avoid git conflicts, it would be better to create your own
"/build/private.properties" instead, in which you can override any of the
settings. That file will be ignored by git.

To avoid the "bootstrap class path not set" warning during compilation
(harmless), configure the "compile.boot" setting in "private.properties" to the
location of an "rt.jar" file belonging to JVM version 7.
