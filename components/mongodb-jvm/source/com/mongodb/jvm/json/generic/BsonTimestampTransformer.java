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

import org.bson.BsonTimestamp;

import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;

/**
 * Transforms a JVM {@link Map} with a "$timestamp" key into a
 * {@link BsonTimestamp}.
 * 
 * @author Tal Liron
 */
public class BsonTimestampTransformer implements JsonTransformer
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

			Object timestamp = map.get( "$timestamp" );
			if( timestamp instanceof Map )
			{
				@SuppressWarnings("unchecked")
				Map<String, Object> timestampMap = (Map<String, Object>) timestamp;

				Object time = timestampMap.get( "t" );
				Object inc = timestampMap.get( "i" );
				if( ( time instanceof Number ) && ( inc instanceof Number ) )
					return new BsonTimestamp( ( (Number) time ).intValue(), ( (Number) inc ).intValue() );
			}
		}

		return null;
	}
}
