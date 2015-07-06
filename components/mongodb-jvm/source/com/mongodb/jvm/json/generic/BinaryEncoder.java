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

import java.io.IOException;
import java.util.LinkedHashMap;

import org.bson.jvm.internal.Base64;
import org.bson.types.Binary;

import com.threecrickets.jvm.json.JsonContext;
import com.threecrickets.jvm.json.JsonEncoder;
import com.threecrickets.jvm.json.generic.MapEncoder;

/**
 * A JSON encoder for a BSON {@link Binary}.
 * 
 * @author Tal Liron
 */
public class BinaryEncoder implements JsonEncoder
{
	//
	// JsonEncoder
	//

	public boolean canEncode( Object object, JsonContext context )
	{
		return object instanceof Binary;
	}

	public void encode( Object object, JsonContext context ) throws IOException
	{
		Binary binary = (Binary) object;

		LinkedHashMap<String, Object> map = new LinkedHashMap<String, Object>();
		map.put( "$binary", Base64.encodeToString( binary.getData(), false ) );
		map.put( "$type", Integer.toHexString( binary.getType() ) );
		new MapEncoder().encode( map, context );
	}
}
