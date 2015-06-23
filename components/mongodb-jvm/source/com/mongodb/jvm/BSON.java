/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm;

import org.bson.BsonDocument;
import org.bson.BsonDocumentReader;
import org.bson.Document;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.DocumentCodec;

import com.mongodb.jvm.nashorn.MongoNashornJsonImplementation;
import com.mongodb.jvm.nashorn.NashornBsonImplementation;
import com.mongodb.jvm.rhino.MongoRhinoJsonImplementation;
import com.mongodb.jvm.rhino.RhinoBsonImplementation;
import com.threecrickets.jvm.json.JSON;

/**
 * Conversion between native JVM language objects and BSON.
 * <p>
 * This class can be used directly in JVM languages.
 * 
 * @author Tal Liron
 */
public class BSON
{
	//
	// Static attributes
	//

	public static BsonImplementation getImplementation()
	{
		return implementation;
	}

	public static void setImplementation( BsonImplementation implementation )
	{
		BSON.implementation = implementation;
	}

	//
	// Static operations
	//

	/**
	 * Recursively convert from native to BSON-compatible values.
	 * 
	 * @param object
	 *        A native object
	 * @return A BSON-compatible object
	 */
	public static Object to( Object object )
	{
		return getImplementation().to( object );
	}

	/**
	 * Recursively convert from BSON to native JavaScript values.
	 * <p>
	 * Creates native dicts, arrays and primitives. The result is
	 * JSON-compatible.
	 * 
	 * @param object
	 *        A BSON object
	 * @return A JSON-compatible native object
	 */
	public static Object from( Object object )
	{
		return getImplementation().from( object );
	}

	/**
	 * Recursively convert from BSON to native JavaScript values.
	 * <p>
	 * Creates native dicts, arrays and primitives. The result is
	 * JSON-compatible.
	 * 
	 * @param object
	 *        A BSON object
	 * @param extendedJSON
	 *        Whether to convert extended JSON objects
	 * @return A JSON-compatible native object
	 */
	public static Object from( Object object, boolean extendedJSON )
	{
		return getImplementation().from( object, extendedJSON );
	}

	/**
	 * Utility method to convert low-level {@link BsonDocument} to high-level
	 * {@link Document}.
	 * 
	 * @param bsonDocument
	 *        The BsonDocument
	 * @return The document
	 */
	public static Document toDocument( BsonDocument bsonDocument )
	{
		BsonDocumentReader reader = new BsonDocumentReader( bsonDocument );
		DocumentCodec codec = new DocumentCodec();
		DecoderContext context = DecoderContext.builder().build();
		return codec.decode( reader, context );
	}

	/**
	 * Enable extended JSON (if JSON is available).
	 */
	public static void enableExtendedJSON()
	{
		try
		{
			try
			{
				JSON.setImplementation( new MongoNashornJsonImplementation() );
			}
			catch( NoClassDefFoundError x )
			{
				// Nashorn not available
				JSON.setImplementation( new MongoRhinoJsonImplementation() );
			}
			catch( UnsupportedClassVersionError x )
			{
				// Nashorn requires at least JVM 7
				JSON.setImplementation( new MongoRhinoJsonImplementation() );
			}
		}
		catch( Throwable x )
		{
		}
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static volatile BsonImplementation implementation;

	static
	{
		try
		{
			implementation = new NashornBsonImplementation();
		}
		catch( NoClassDefFoundError x )
		{
			// Nashorn not available
			implementation = new RhinoBsonImplementation();
		}
		catch( UnsupportedClassVersionError x )
		{
			// Nashorn requires at least JVM 7
			implementation = new RhinoBsonImplementation();
		}
	}
}
