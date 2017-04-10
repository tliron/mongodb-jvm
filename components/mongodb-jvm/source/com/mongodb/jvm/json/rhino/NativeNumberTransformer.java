/**
 * Copyright 2010-2017 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.json.rhino;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.UniqueTag;

import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;
import com.threecrickets.jvm.json.util.JsonUtil;

/**
 * Transforms a Rhino {@link Scriptable} with a "$numberLong" key into a Rhino
 * NativeNumber (the class is private in Rhino), but <i>only if it can be
 * converted into a double without losing precision</i>.
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
		if( object instanceof Scriptable )
		{
			Scriptable scriptable = (Scriptable) object;
			Object numberLong = scriptable.get( "$numberLong", scriptable );
			if( ( numberLong != null ) && ( numberLong.getClass() != UniqueTag.class ) )
			{
				// Might throw a NumberFormatException
				Long asLong = Long.parseLong( numberLong.toString() );
				Double asDouble = asLong.doubleValue();

				if( JsonUtil.numberToString( asLong ).equals( JsonUtil.numberToString( asDouble ) ) )
				{
					// Converting to double doesn't lose accuracy
					Context context = Context.getCurrentContext();
					Scriptable scope = ScriptRuntime.getTopCallScope( context );
					return context.newObject( scope, "Number", new Object[]
					{
						asDouble
					} );
				}
			}
		}

		return null;
	}
}
