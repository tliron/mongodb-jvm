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

import com.threecrickets.jvm.json.nashorn.NashornJsonImplementationOld;

/**
 * A {@link NashornJsonImplementationOld} that uses
 * {@link MongoNashornJsonExtenderOld}.
 * 
 * @author Tal Liron
 */
public class MongoNashornJsonImplementationOld extends NashornJsonImplementationOld
{
	public MongoNashornJsonImplementationOld()
	{
		super( new MongoNashornJsonExtenderOld() );
	}

	//
	// JsonImplementation
	//

	public int getPriority()
	{
		return 1;
	}
}
