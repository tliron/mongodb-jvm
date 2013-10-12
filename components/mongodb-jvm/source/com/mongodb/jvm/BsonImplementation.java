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

public interface BsonImplementation
{
	/**
	 * Recursively convert from native to BSON-compatible values.
	 * 
	 * @param object
	 *        A native object
	 * @return A BSON-compatible object
	 */
	public abstract Object to( Object object );

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
	public abstract Object from( Object object );

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
	public abstract Object from( Object object, boolean extendedJSON );
}