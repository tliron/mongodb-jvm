/**
 * Copyright 2010-2013 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.nashorn;

import com.threecrickets.jvm.json.nashorn.NashornJsonImplementation;

/**
 * A {@link NashornJsonImplementation} that uses
 * {@link MongoNashornJsonExtender}.
 * 
 * @author Tal Liron
 */
public class MongoNashornJsonImplementation extends NashornJsonImplementation
{
	public MongoNashornJsonImplementation()
	{
		super( new MongoNashornJsonExtender() );
	}
}
