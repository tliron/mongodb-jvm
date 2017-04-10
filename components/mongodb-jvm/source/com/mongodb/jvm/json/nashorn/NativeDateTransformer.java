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

package com.mongodb.jvm.json.nashorn;

import com.threecrickets.jvm.json.JsonImplementation;
import com.threecrickets.jvm.json.JsonTransformer;

import jdk.nashorn.internal.objects.NativeDate;
import jdk.nashorn.internal.runtime.ScriptObject;
import jdk.nashorn.internal.runtime.Undefined;

/**
 * Transforms a Nashorn {@link ScriptObject} with a "$date" key into a Nashorn
 * {@link NativeDate}.
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
		if( object instanceof ScriptObject )
		{
			Object date = ( (ScriptObject) object ).get( "$date" );
			if( ( date != null ) && ( date.getClass() != Undefined.class ) )
				return NativeDate.construct( true, null, date );
		}

		return null;
	}
}
