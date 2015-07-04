
MongoDB JVM
===========

Though the JVM has the [Java MongoDB Driver]
(http://docs.mongodb.org/ecosystem/drivers/java/), which can be used by any
non-Java language running on the JVM, in practice it is designed for Java and
awkward to use in other languages.

The goal of this project is to supply "wrappers" that allow languages running
on the JVM to use the Java driver with the culture and paradigms appropriate to
that language. It also includes a library to translate directly between BSON and
native language types without going through Java types, as well as an extensible
JSON encoder/decoder, which supports MongoDB [extended JSON]
(http://docs.mongodb.org/manual/reference/mongodb-extended-json/) for both
directions.

Currently, the project supports JavaScript via both the Nashorn and Rhino
engines. The wrapper attempts to mimic the [Node.js MongoDB Driver]
(http://docs.mongodb.org/ecosystem/drivers/node-js/) while also being true to
the feature set of the Java driver.

As an added bonus, the project comes with a powerful JavaScript shell,
essentially a clone for the JVM of the [mongo shell]
(http://docs.mongodb.org/manual/administration/scripting/) that comes with
MongoDB. It can do most anything that mongo can do, while also letting you use
any JVM library from JavaScript. It is itself written in JavaScript, and as such
is very easy to hack and adapt to your particular needs.

To run the shell:

	./sincerity mongo

Add "--help" to see command-line options, and run "help" from within the shell
to see the commands. The shell supports basic TAB-key completion.

You may also be interested in [MongoVision]
(https://github.com/tliron/mongovision), a web-based MongoDB administrative
interface, which is written in JavaScript using this wrapper.

[![Download]
(http://threecrickets.com/media/download.png)](https://drive.google.com/folderview?id=0B5XU4AmCevRXUnNkeWR2TkVCV2M&usp=sharing)


Building MongoDB JVM
--------------------

To build MongoDB JVM you need [Ant] (http://ant.apache.org/) for the basic build
script, 
[Maven] (http://maven.apache.org/) if you want to publish it via the
"deploy-maven" target, and [Sincerity] (http://threecrickets.com/sincerity/) if
you want to create the final distribution (the "distribution" target).

You may need to create a file named "/build/private.properties" (see below) and
override the default locations for Maven and Sincerity.

Then, simply change to the "/build/" directory and run "ant".

During the build process, build and distribution dependencies will be
downloaded from an online repository at http://repository.threecrickets.com/, so
you will need Internet access.

The result of the build will go into the "/build/distribution/conent/"
directory. Temporary files used during the build process will go into
"/build/cache/", which you are free to delete.


Configuring the Build
---------------------

The "/build/custom.properties" file contains configurable settings, along with
some commentary on what they are used for. You are free to edit that file,
however to avoid git conflicts, it would be better to create your own
"/build/private.properties" instead, in which you can override any of the
settings. That file will be ignored by git.