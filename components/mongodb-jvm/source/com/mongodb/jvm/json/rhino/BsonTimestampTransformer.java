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

import org.bson.BsonTimestamp;
import org.mozilla.javascript.Scriptable;

import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;

/**
 * Transforms a Rhino {@link Scriptable} with a "$timestamp" key into a
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
		if( object instanceof Scriptable )
		{
			Scriptable scriptable = (Scriptable) object;

			Object timestamp = scriptable.get( "$timestamp", scriptable );
			if( timestamp instanceof Scriptable )
			{
				Scriptable timestampScriptable = (Scriptable) timestamp;

				Object time = timestampScriptable.get( "t", timestampScriptable );
				Object inc = timestampScriptable.get( "i", timestampScriptable );
				if( ( time instanceof Scriptable ) && ( (Scriptable) time ).getClassName().equals( "Number" ) )
					time = ( (Scriptable) time ).getDefaultValue( Double.class );
				if( ( inc instanceof Scriptable ) && ( (Scriptable) inc ).getClassName().equals( "Number" ) )
					inc = ( (Scriptable) inc ).getDefaultValue( Double.class );
				if( ( time instanceof Number ) && ( inc instanceof Number ) )
					return new BsonTimestamp( ( (Number) time ).intValue(), ( (Number) inc ).intValue() );
			}
		}

		return null;
	}
}
