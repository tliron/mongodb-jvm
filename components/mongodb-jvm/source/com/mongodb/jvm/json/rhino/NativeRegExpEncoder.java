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

package com.mongodb.jvm.json.rhino;

import java.io.IOException;
import java.util.LinkedHashMap;

import org.mozilla.javascript.Scriptable;

import com.threecrickets.jvm.json.JsonContext;
import com.threecrickets.jvm.json.JsonEncoder;
import com.threecrickets.jvm.json.generic.MapEncoder;

/**
 * A JSON encoder for a Rhino NativeRegExp (the class is private in Rhino).
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
		return ( object instanceof Scriptable ) && ( (Scriptable) object ).getClassName().equals( "RegExp" );
	}

	public void encode( Object object, JsonContext context ) throws IOException
	{
		Scriptable nativeRegExp = (Scriptable) object;

		String source = nativeRegExp.get( "source", nativeRegExp ).toString();

		Object isGlobal = nativeRegExp.get( "global", nativeRegExp );
		Object isIgnoreCase = nativeRegExp.get( "ignoreCase", nativeRegExp );
		Object isMultiLine = nativeRegExp.get( "multiline", nativeRegExp );

		String options = "";
		if( ( ( isGlobal instanceof Boolean ) && ( ( (Boolean) isGlobal ).booleanValue() ) )
			|| ( ( isGlobal instanceof Scriptable ) && ( (Boolean) ( (Scriptable) isGlobal ).getDefaultValue( Boolean.class ) ).booleanValue() ) )
			options += "g";
		if( ( ( isIgnoreCase instanceof Boolean ) && ( ( (Boolean) isIgnoreCase ).booleanValue() ) )
			|| ( ( isIgnoreCase instanceof Scriptable ) && ( (Boolean) ( (Scriptable) isIgnoreCase ).getDefaultValue( Boolean.class ) ).booleanValue() ) )
			options += "i";
		if( ( ( isMultiLine instanceof Boolean ) && ( ( (Boolean) isMultiLine ).booleanValue() ) )
			|| ( ( isMultiLine instanceof Scriptable ) && ( (Boolean) ( (Scriptable) isMultiLine ).getDefaultValue( Boolean.class ) ).booleanValue() ) )
			options += "m";

		LinkedHashMap<String, Object> map = new LinkedHashMap<String, Object>();
		map.put( "$regex", source );
		map.put( "$options", options );
		new MapEncoder().encode( map, context );
	}
}
