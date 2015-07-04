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
import org.bson.BsonDocumentWrapper;
import org.bson.codecs.configuration.CodecRegistry;

import com.mongodb.MongoClient;
import com.mongodb.jvm.nashorn.NashornUtil;

import jdk.nashorn.internal.runtime.ScriptObject;

/**
 * @author Tal Liron
 */
public class Bson
{
	public static Class<?> getDocumentClass()
	{
		return ScriptObject.class;
	}

	public static CodecRegistry getCodecRegistry()
	{
		return getCodecRegistry( MongoClient.getDefaultCodecRegistry() );
	}

	public static CodecRegistry getCodecRegistry( CodecRegistry next )
	{
		return NashornUtil.newCodecRegistry( next );
	}

	public static BsonDocument to( Object o )
	{
		return BsonDocumentWrapper.asBsonDocument( o, getCodecRegistry() );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private Bson()
	{
	}
}
