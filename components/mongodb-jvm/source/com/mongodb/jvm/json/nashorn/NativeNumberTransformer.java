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

import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;
import com.threecrickets.jvm.json.util.JsonUtil;

import jdk.nashorn.internal.objects.NativeNumber;
import jdk.nashorn.internal.runtime.ScriptObject;
import jdk.nashorn.internal.runtime.Undefined;

/**
 * Transforms a Nashorn {@link ScriptObject} with a "$numberLong" key into a
 * Nashorn {@link NativeNumber}, but <i>only if it can be converted into a
 * double without losing precision</i>.
 * 
 * @author Tal Liron
 */
public class NativeNumberTransformer implements JsonTransformer
{
	//
	// JsonTransformer
	//

	public Object transform( Object object, JsonImplementation implementation )
	{
		if( object instanceof ScriptObject )
		{
			Object numberLong = ( (ScriptObject) object ).get( "$numberLong" );
			if( ( numberLong != null ) && ( numberLong.getClass() != Undefined.class ) )
			{
				// Might throw a NumberFormatException
				Long asLong = Long.parseLong( numberLong.toString() );
				Double asDouble = asLong.doubleValue();

				if( JsonUtil.numberToString( asLong ).equals( JsonUtil.numberToString( asDouble ) ) )
					// Converting to double doesn't lose accuracy
					return NativeNumber.constructor( true, null, asDouble );
			}
		}

		return null;
	}
}
