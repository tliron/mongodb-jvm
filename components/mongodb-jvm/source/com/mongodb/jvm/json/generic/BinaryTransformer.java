/**
 * Copyright 2010-2017 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.json.generic;

import java.util.Map;

import org.bson.jvm.internal.Base64;
import org.bson.types.Binary;

import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;

/**
 * Transforms a JVM {@link Map} with a "$binary" key into a BSON {@link Binary}.
 * 
 * @author Tal Liron
 */
public class BinaryTransformer implements JsonTransformer
{
	//
	// JsonTransformer
	//

	public Object transform( Object object, JsonImplementation implementation )
	{
		if( object instanceof Map )
		{
			@SuppressWarnings("unchecked")
			Map<String, Object> map = (Map<String, Object>) object;

			Object binary = map.get( "$binary" );
			if( binary != null )
			{
				Object type = map.get( "$type" );
				byte typeNumber = type != null ? Byte.valueOf( type.toString(), 16 ) : 0;
				byte[] data = Base64.decodeFast( binary.toString() );
				return new Binary( typeNumber, data );
			}
		}

		return null;
	}
}
