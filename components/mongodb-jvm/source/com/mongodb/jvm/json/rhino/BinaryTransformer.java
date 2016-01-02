/**
 * Copyright 2010-2016 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.json.rhino;

import org.bson.jvm.internal.Base64;
import org.bson.types.Binary;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.UniqueTag;

import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;

/**
 * Transforms a Rhino {@link Scriptable} with a "$binary" key into a BSON
 * {@link Binary}.
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
		if( object instanceof Scriptable )
		{
			Scriptable scriptable = (Scriptable) object;

			Object binary = scriptable.get( "$binary", scriptable );
			if( ( binary != null ) && ( binary.getClass() != UniqueTag.class ) )
			{
				Object type = scriptable.get( "$type", scriptable );
				byte typeNumber = ( ( type != null ) && ( type.getClass() != UniqueTag.class ) ) ? Byte.valueOf( type.toString(), 16 ) : 0;
				byte[] data = Base64.decodeFast( binary.toString() );
				return new Binary( typeNumber, data );
			}
		}

		return null;
	}
}
