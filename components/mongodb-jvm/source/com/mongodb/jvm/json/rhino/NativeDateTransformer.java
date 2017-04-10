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

/**
 * Transforms a Rhino {@link Scriptable} with a "$date" key into a Rhino
 * NativeDate (the class is private in Rhino).
 * 
 * @author Tal Liron
 */
public class NativeDateTransformer implements JsonTransformer
{
	//
	// JsonTransformer
	//

	public Object transform( Object object, JsonImplementation implementation )
	{
		if( object instanceof Scriptable )
		{
			Scriptable scriptable = (Scriptable) object;
			Object date = scriptable.get( "$date", scriptable );
			if( ( date != null ) && ( date.getClass() != UniqueTag.class ) )
			{
				Context context = Context.getCurrentContext();
				Scriptable scope = ScriptRuntime.getTopCallScope( context );
				return context.newObject( scope, "Date", new Object[]
				{
					date
				} );
			}
		}

		return null;
	}
}
