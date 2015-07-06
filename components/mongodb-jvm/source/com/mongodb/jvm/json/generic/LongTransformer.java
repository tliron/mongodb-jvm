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

package com.mongodb.jvm.json.generic;

import java.util.Map;

import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;

/**
 * Transforms a JVM {@link Map} with a "$numberLong" key into a JVM {@link Long}
 * .
 * 
 * @author Tal Liron
 */
public class LongTransformer implements JsonTransformer
{
	//
	// JsonTransformer
	//

	public Object transform( Object object, JsonImplementation implementation )
	{
		if( object instanceof Map )
		{
			@SuppressWarnings("unchecked")
			Object numberLong = ( (Map<String, Object>) object ).get( "$numberLong" );
			if( numberLong != null )
				// Might throw a NumberFormatException
				return new Long( Long.parseLong( numberLong.toString() ) );
		}

		return null;
	}
}
