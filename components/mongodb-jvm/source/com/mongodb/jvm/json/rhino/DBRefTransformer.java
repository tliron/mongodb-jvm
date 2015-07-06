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

package com.mongodb.jvm.json.rhino;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.UniqueTag;

import com.mongodb.DBRef;
import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;

/**
 * Transforms a Rhino {@link Scriptable} with a "$ref" key into a BSON
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
		if( object instanceof Scriptable )
		{
			Scriptable scriptable = (Scriptable) object;

			Object ref = scriptable.get( "$ref", scriptable );
			if( ( ref != null ) && ( ref.getClass() != UniqueTag.class ) )
			{
				Object id = scriptable.get( "$id", scriptable );
				if( ( id != null ) && ( id.getClass() != UniqueTag.class ) )
					return new DBRef( ref.toString(), id );
			}
		}

		return null;
	}
}
