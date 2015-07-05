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

package com.mongodb.jvm.json.nashorn;

import org.bson.jvm.internal.Base64;
import org.bson.types.Binary;

import com.threecrickets.jvm.json.JsonTransformer;

import jdk.nashorn.internal.runtime.ScriptObject;
import jdk.nashorn.internal.runtime.Undefined;

public class BinaryTransformer implements JsonTransformer
{
	//
	// JsonTransformer
	//

	public Object transform( Object object )
	{
		if( object instanceof ScriptObject )
		{
			ScriptObject scriptObject = (ScriptObject) object;

			Object binary = scriptObject.get( "$binary" );
			if( ( binary != null ) && ( binary.getClass() != Undefined.class ) )
			{
				Object type = scriptObject.get( "$type" );
				byte typeNumber = ( ( type != null ) && ( type.getClass() != Undefined.class ) ) ? Byte.valueOf( type.toString(), 16 ) : 0;
				byte[] data = Base64.decodeFast( binary.toString() );
				return new Binary( typeNumber, data );
			}
		}

		return null;
	}
}
