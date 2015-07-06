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

import java.io.IOException;
import java.util.HashMap;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import com.threecrickets.jvm.json.JsonContext;
import com.threecrickets.jvm.json.JsonEncoder;
import com.threecrickets.jvm.json.generic.MapEncoder;

/**
 * A JSON encoder for a Rhino NativeDate (the class is private in Rhino).
 * 
 * @author Tal Liron
 */
public class NativeDateEncoder implements JsonEncoder
{
	//
	// JsonEncoder
	//

	public boolean canEncode( Object object, JsonContext context )
	{
		return ( object instanceof Scriptable ) && ( (Scriptable) object ).getClassName().equals( "Date" );
	}

	public void encode( Object object, JsonContext context ) throws IOException
	{
		Scriptable nativeDate = (Scriptable) object;
		Object time = ScriptableObject.callMethod( nativeDate, "getTime", null );

		HashMap<String, Object> map = new HashMap<String, Object>();
		map.put( "$date", time );
		new MapEncoder().encode( map, context );
	}
}
