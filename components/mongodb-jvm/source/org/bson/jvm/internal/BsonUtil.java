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

package org.bson.jvm.internal;

import org.bson.BsonReader;
import org.bson.BsonType;
import org.bson.BsonWriter;
import org.bson.codecs.BsonTypeClassMap;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.bson.codecs.configuration.CodecConfigurationException;
import org.bson.codecs.configuration.CodecRegistry;

/**
 * @author Tal Liron
 */
public class BsonUtil
{
	/**
	 * Encodes a value to a BSON writer with the appropriate codec.
	 * 
	 * @param value
	 *        The value
	 * @param writer
	 *        The BSON writer
	 * @param encoderContext
	 *        The encoder context
	 * @param codecRegistry
	 *        The codec registry
	 */
	public static void writeChild( Object value, BsonWriter writer, EncoderContext encoderContext, CodecRegistry codecRegistry )
	{
		if( value == null )
			writer.writeNull();
		else
		{
			try
			{
				@SuppressWarnings("unchecked")
				Codec<Object> codec = (Codec<Object>) codecRegistry.get( value.getClass() );
				encoderContext.encodeWithChildContext( codec, writer, value );
			}
			catch( CodecConfigurationException x )
			{
				writer.writeNull();
			}
		}
	}

	/**
	 * Decodes a value from a BSON writer with the appopriate codec.
	 * 
	 * @param reader
	 *        The BSON reader
	 * @param decoderContext
	 *        The decoder context
	 * @param codecRegistry
	 *        The codec registry
	 * @param bsonTypeClassMap
	 *        The BSON type class map
	 * @return The value
	 */
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
