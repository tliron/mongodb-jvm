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

import java.io.IOException;
import java.util.LinkedHashMap;

import com.threecrickets.jvm.json.JsonContext;
import com.threecrickets.jvm.json.JsonEncoder;
import com.threecrickets.jvm.json.generic.MapEncoder;

import jdk.nashorn.internal.objects.NativeBoolean;
import jdk.nashorn.internal.objects.NativeRegExp;

/**
 * A JSON encoder for a Nashorn {@link NativeRegExp}.
 * 
 * @author Tal Liron
 */
public class NativeRegExpEncoder implements JsonEncoder
{
	//
	// JsonEncoder
	//

	public boolean canEncode( Object object, JsonContext context )
	{
		return object instanceof NativeRegExp;
	}

	public void encode( Object object, JsonContext context ) throws IOException
	{
		NativeRegExp nativeRegExp = (NativeRegExp) object;

		String source = nativeRegExp.get( "source" ).toString();

		Object isGlobal = nativeRegExp.get( "global" );
		Object isIgnoreCase = nativeRegExp.get( "ignoreCase" );
		Object isMultiLine = nativeRegExp.get( "multiline" );

		String options = "";
		if( ( ( isGlobal instanceof Boolean ) && ( ( (Boolean) isGlobal ).booleanValue() ) ) || ( ( isGlobal instanceof NativeBoolean ) && ( (NativeBoolean) isGlobal ).booleanValue() ) )
			options += "g";
		if( ( ( isIgnoreCase instanceof Boolean ) && ( ( (Boolean) isIgnoreCase ).booleanValue() ) ) || ( ( isIgnoreCase instanceof NativeBoolean ) && ( (NativeBoolean) isIgnoreCase ).booleanValue() ) )
			options += "i";
		if( ( ( isMultiLine instanceof Boolean ) && ( ( (Boolean) isMultiLine ).booleanValue() ) ) || ( ( isMultiLine instanceof NativeBoolean ) && ( (NativeBoolean) isMultiLine ).booleanValue() ) )
			options += "m";

		LinkedHashMap<String, Object> map = new LinkedHashMap<String, Object>();
		map.put( "$regex", source );
		map.put( "$options", options );
		new MapEncoder().encode( map, context );
	}
}
