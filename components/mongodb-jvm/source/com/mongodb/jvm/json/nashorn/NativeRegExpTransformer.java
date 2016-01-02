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

import jdk.nashorn.internal.objects.NativeRegExp;
import jdk.nashorn.internal.runtime.ScriptObject;
import jdk.nashorn.internal.runtime.Undefined;

/**
 * Transforms a Nashorn {@link ScriptObject} with a "$regex" key into a Nashorn
 * {@link NativeRegExp}.
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
		if( object instanceof ScriptObject )
		{
			ScriptObject scriptObject = (ScriptObject) object;

			Object regex = scriptObject.get( "$regex" );
			if( ( regex != null ) && ( regex.getClass() != Undefined.class ) )
			{
				Object options = scriptObject.get( "$options" );
				if( ( options != null ) && ( options.getClass() != Undefined.class ) )
					NativeRegExp.constructor( true, null, regex.toString(), options.toString() );
				else
					NativeRegExp.constructor( true, null, regex.toString() );
			}
		}

		return null;
	}
}
