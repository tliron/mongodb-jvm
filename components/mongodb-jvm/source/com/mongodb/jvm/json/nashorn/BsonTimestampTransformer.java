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

import org.bson.BsonTimestamp;

import com.threecrickets.jvm.json.JsonTransformer;

import jdk.nashorn.internal.objects.NativeNumber;
import jdk.nashorn.internal.runtime.ScriptObject;

public class BsonTimestampTransformer implements JsonTransformer
{
	//
	// JsonTransformer
	//

	public Object transform( Object object )
	{
		if( object instanceof ScriptObject )
		{
			ScriptObject scriptObject = (ScriptObject) object;

			Object timestamp = scriptObject.get( "$timestamp" );
			if( timestamp instanceof ScriptObject )
			{
				ScriptObject timestampScriptObject = (ScriptObject) timestamp;

				Object time = timestampScriptObject.get( "t" );
				Object inc = timestampScriptObject.get( "i" );
				if( time instanceof NativeNumber )
					time = ( (NativeNumber) time ).getValue();
				if( inc instanceof NativeNumber )
					inc = ( (NativeNumber) inc ).getValue();
				if( ( time instanceof Number ) && ( inc instanceof Number ) )
					return new BsonTimestamp( ( (Number) time ).intValue(), ( (Number) inc ).intValue() );
			}
		}

		return null;
	}
}
