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

import com.mongodb.DBRef;
import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;

import jdk.nashorn.internal.runtime.ScriptObject;
import jdk.nashorn.internal.runtime.Undefined;

/**
 * Transforms a Nashorn {@link ScriptObject} with a "$ref" key into a BSON
 * {@link DBRef}.
 * 
 * @author Tal Liron
 */
public class DBRefTransformer implements JsonTransformer
{
	//
	// JsonTransformer
	//

	public Object transform( Object object, JsonImplementation implementation )
	{
		if( object instanceof ScriptObject )
		{
			ScriptObject scriptObject = (ScriptObject) object;

			Object ref = scriptObject.get( "$ref" );
			if( ( ref != null ) && ( ref.getClass() != Undefined.class ) )
			{
				Object id = scriptObject.get( "$id" );
				if( ( id != null ) && ( id.getClass() != Undefined.class ) )
					return new DBRef( ref.toString(), id );
			}
		}

		return null;
	}
}
