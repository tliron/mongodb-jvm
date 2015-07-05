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

package com.mongodb.jvm;

import org.bson.BsonDocument;
import org.bson.codecs.configuration.CodecRegistry;

/**
 * @author Tal Liron
 */
public class DefaultBsonImplementation implements BsonImplementation
{
	//
	// BsonImplementation
	//

	public String getName()
	{
		return null;
	}

	public int getPriority()
	{
		return 0;
	}

	public Class<?> getDocumentClass()
	{
		return BsonDocument.class;
	}

	public CodecRegistry getCodecRegistry( CodecRegistry next )
	{
		return next;
	}

	public Object toNativeString( String string )
	{
		return string;
	}
}
