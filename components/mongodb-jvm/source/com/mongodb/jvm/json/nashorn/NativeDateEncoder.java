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

package com.mongodb.jvm.json.nashorn;

import java.io.IOException;
import java.util.HashMap;

import com.threecrickets.jvm.json.JsonContext;
import com.threecrickets.jvm.json.JsonEncoder;
import com.threecrickets.jvm.json.generic.MapEncoder;

import jdk.nashorn.internal.objects.NativeDate;

/**
 * A JSON encoder for a Nashorn {@link NativeDate}.
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
		return object instanceof NativeDate;
	}

	public void encode( Object object, JsonContext context ) throws IOException
	{
		double date = NativeDate.getTime( object );

		HashMap<String, Object> map = new HashMap<String, Object>();
		map.put( "$date", date );
		new MapEncoder().encode( map, context );
	}
}
