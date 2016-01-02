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

package org.bson.jvm.internal;

import org.bson.BsonReader;
import org.bson.BsonType;
import org.bson.BsonWriter;
import org.bson.codecs.BsonTypeClassMap;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.bson.codecs.configuration.CodecRegistry;

/**
 * @author Tal Liron
 */
public class BsonUtil
{
	public static void writeChild( Object value, BsonWriter writer, EncoderContext encoderContext, CodecRegistry codecRegistry )
	{
		if( value == null )
			writer.writeNull();
		else
		{
			@SuppressWarnings("unchecked")
			Codec<Object> codec = (Codec<Object>) codecRegistry.get( value.getClass() );
			encoderContext.encodeWithChildContext( codec, writer, value );
		}
	}

	public static Object read( BsonReader reader, DecoderContext decoderContext, CodecRegistry codecRegistry, BsonTypeClassMap bsonTypeClassMap )
	{
		BsonType type = reader.getCurrentBsonType();
		Class<?> clazz = bsonTypeClassMap.get( type );
		return codecRegistry.get( clazz ).decode( reader, decoderContext );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private BsonUtil()
	{
	}
}
