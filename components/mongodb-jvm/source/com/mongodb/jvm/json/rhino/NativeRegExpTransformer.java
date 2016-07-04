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

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.UniqueTag;

import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;

/**
 * Transforms a Rhino {@link Scriptable} with a "$regex" key into a Rhino
 * NativeRegExp (the class is private in Rhino).
 * 
 * @author Tal Liron
 */
public class NativeRegExpTransformer implements JsonTransformer
{
	//
	// JsonTransformer
	//

	public Object transform( Object object, JsonImplementation implementation )
	{
		if( object instanceof Scriptable )
		{
			Scriptable scriptable = (Scriptable) object;

			Object regex = scriptable.get( "$regex", scriptable );
			if( ( regex != null ) && ( regex.getClass() != UniqueTag.class ) )
			{
				Object options = scriptable.get( "$options", scriptable );

				Context context = Context.getCurrentContext();
				Scriptable scope = ScriptRuntime.getTopCallScope( context );
				if( ( options != null ) && ( options.getClass() != UniqueTag.class ) )
					return context.newObject( scope, "RegExp", new Object[]
					{
						regex.toString(), options.toString()
					} );
				else
					return context.newObject( scope, "RegExp", new Object[]
					{
						regex.toString()
					} );
			}
		}

		return null;
	}
}
