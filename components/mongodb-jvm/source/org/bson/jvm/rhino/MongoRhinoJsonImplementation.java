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

package org.bson.jvm.rhino;

import com.threecrickets.jvm.json.rhino.RhinoJsonImplementationOld;

/**
 * A {@link RhinoJsonImplementationOld} that uses {@link MongoRhinoJsonExtender}.
 * 
 * @author Tal Liron
 */
public class MongoRhinoJsonImplementation extends RhinoJsonImplementationOld
{
	public MongoRhinoJsonImplementation()
	{
		super( new MongoRhinoJsonExtender() );
	}

	//
	// JsonImplementation
	//

	public int getPriority()
	{
		return 1;
	}
}
