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

package com.mongodb.jvm.json.java;

import java.io.IOException;
import java.util.LinkedHashMap;

import com.mongodb.DBRef;
import com.threecrickets.jvm.json.JsonContext;
import com.threecrickets.jvm.json.JsonEncoder;
import com.threecrickets.jvm.json.java.MapEncoder;

public class DBRefEncoder implements JsonEncoder
{
	//
	// JsonEncoder
	//

	public boolean canEncode( Object object, JsonContext context )
	{
		return object instanceof DBRef;
	}

	public void encode( Object object, JsonContext context ) throws IOException
	{
		DBRef dbRef = (DBRef) object;

		LinkedHashMap<String, Object> map = new LinkedHashMap<String, Object>();
		map.put( "$ref", dbRef.getCollectionName() );
		map.put( "$id", dbRef.getId() );
		new MapEncoder().encode( map, context );
	}
}
