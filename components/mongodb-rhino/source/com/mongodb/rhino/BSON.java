/**
 * Copyright 2010-2012 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.rhino;

import com.mongodb.util.JSON;

/**
 * Conversion between native Rhino objects and BSON.
 * <p>
 * This class can be used directly in Rhino.
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
	 * Recursively convert from native JavaScript to BSON-compatible types.
	 * <p>
	 * Recognizes JavaScript objects, arrays, Date objects, RegExp objects and
	 * primitives.
	 * <p>
	 * Also recognizes JavaScript objects adhering to MongoDB's extended JSON,
	 * converting them to BSON types: {$oid:'objectid'},
	 * {$binary:'base64',$type:'hex'}, {$ref:'collection',$id:'objectid'}.
	 * <p>
	 * Note that the {$date:timestamp} and {$regex:'pattern',$options:'options'}
	 * extended JSON formats are recognized as well as native JavaScript Date
	 * and RegExp objects.
	 * 
	 * @param object
	 *        A Rhino native object
	 * @return A BSON-compatible object
	 */
	public static Object to( Object object )
	{
		return getImplementation().to( object );
	}

	/**
	 * Recursively convert from BSON to native JavaScript values.
	 * <p>
	 * Converts to JavaScript objects, arrays, Date objectss and primitives. The
	 * result is JSON-compatible.
	 * <p>
	 * Note that special MongoDB types (ObjectIds, Binary and DBRef) are not
	 * converted, but {@link JSON#to(Object)} recognizes them, so they can still
	 * be considered JSON-compatible in this limited sense. Use
	 * {@link #from(Object, boolean)} if you want to convert them to MongoDB's
	 * extended JSON.
	 * 
	 * @param object
	 *        A BSON object
	 * @return A JSON-compatible Rhino object
	 */
	public static Object from( Object object )
	{
		return getImplementation().from( object );
	}

	/**
	 * Recursively convert from BSON to native JavaScript values.
	 * <p>
	 * Converts to JavaScript objects, arrays, Date objects, RegExp objects and
	 * primitives. The result is JSON-compatible.
	 * <p>
	 * Can optionally convert MongoDB's types to extended JSON:
	 * {$oid:'objectid'}, {$binary:'base64',$type:'hex'},
	 * {$ref:'collection',$id:'objectid'}.
	 * <p>
	 * Note that even if they are not converted, {@link JSON#to(Object)}
	 * recognizes them, so they can still be considered JSON-compatible in this
	 * limited sense.
	 * 
	 * @param object
	 *        A BSON object
	 * @param extendedJSON
	 *        Whether to convert extended JSON objects
	 * @return A JSON-compatible Rhino object
	 */
	public static Object from( Object object, boolean extendedJSON )
	{
		return getImplementation().from( object, extendedJSON );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static volatile BsonImplementation implementation = new BsonImplementation();
}
