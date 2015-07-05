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

package org.bson.jvm.nashorn;

import java.util.ArrayList;
import java.util.List;

import org.bson.BsonReader;
import org.bson.BsonType;
import org.bson.BsonWriter;
import org.bson.codecs.BsonTypeClassMap;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.jvm.internal.BsonUtil;

import jdk.nashorn.internal.objects.NativeArray;
import jdk.nashorn.internal.runtime.arrays.ArrayData;

/**
 * A BSON codec for a Nashorn {@link NativeArray}.
 * 
 * @author Tal Liron
 */
public class NativeArrayCodec implements Codec<NativeArray>
{
	//
	// Construction
	//

	public NativeArrayCodec( CodecRegistry codecRegistry, BsonTypeClassMap bsonTypeClassMap )
	{
		this.codecRegistry = codecRegistry;
		this.bsonTypeClassMap = bsonTypeClassMap;
	}

	//
	// Codec
	//

	public Class<NativeArray> getEncoderClass()
	{
		return NativeArray.class;
	}

	public void encode( BsonWriter writer, NativeArray nativeArray, EncoderContext encoderContext )
	{
		ArrayData data = nativeArray.getArray();

		writer.writeStartArray();
		for( int i = 0, length = (int) data.length(); i < length; i++ )
		{
			Object item = data.getObject( i );
			BsonUtil.writeChild( item, writer, encoderContext, codecRegistry );
		}
		writer.writeEndArray();
	}

	public NativeArray decode( BsonReader reader, DecoderContext decoderContext )
	{
		List<Object> list = new ArrayList<Object>();

		reader.readStartArray();
		while( reader.readBsonType() != BsonType.END_OF_DOCUMENT )
		{
			Object item = BsonUtil.read( reader, decoderContext, codecRegistry, bsonTypeClassMap );
			list.add( item );
		}
		reader.readEndArray();

		NativeArray nativeArray = (NativeArray) NativeArray.construct( true, null, list.size() );
		int index = 0;
		for( Object item : list )
			nativeArray.set( index++, item, 0 );
		return nativeArray;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final CodecRegistry codecRegistry;

	private final BsonTypeClassMap bsonTypeClassMap;
}
