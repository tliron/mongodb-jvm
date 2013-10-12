/**
 * Copyright 2010-2013 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm;

import com.mongodb.jvm.nashorn.NashornBsonImplementation;
import com.mongodb.jvm.rhino.RhinoBsonImplementation;

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
