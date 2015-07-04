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
import org.bson.Document;
import org.bson.json.JsonWriterSettings;

import jdk.nashorn.internal.objects.NativeString;

/**
 * @author Tal Liron
 */
public class Json
{
	public static Object from( String json )
	{
		return BsonDocument.parse( json );
	}

	public static Object to( Object o, boolean indent )
	{
		String r = null;
		JsonWriterSettings settings = new JsonWriterSettings( indent );

		if( o instanceof Document )
			r = ( (Document) o ).toJson( settings );
		else if( o instanceof BsonDocument )
			r = ( (BsonDocument) o ).toJson( settings );

		if( r == null )
			return r;
		else
			return NativeString.constructor( true, null, r );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private Json()
	{
	}
}
