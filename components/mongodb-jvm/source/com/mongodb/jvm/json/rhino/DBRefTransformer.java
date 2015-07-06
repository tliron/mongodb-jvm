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

import org.bson.BsonDocument;
import org.bson.BsonValue;
import org.bson.jvm.Bson;
import org.bson.jvm.BsonImplementation;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.UniqueTag;

import com.mongodb.DBRef;
import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;

/**
 * Transforms a Rhino {@link Scriptable} with a "$ref" key into a BSON
 * {@link DBRef}.
 * <p>
 * For this to work, you need a compatible {@link BsonImplementation} installed
 * in {@link Bson}.
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
				BsonDocument dbRef = Bson.to( scriptable );
				BsonValue id = dbRef.get( "$id" );
				if( id != null )
					// Note: the id must be in BSON types!
					return new DBRef( ref.toString(), id );
			}
		}

		return null;
	}
}
