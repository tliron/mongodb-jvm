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

package com.mongodb.jvm.rhino;

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
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import com.mongodb.jvm.internal.BsonUtil;

/**
 * A BSON codec for a Rhino {@link NativeArray}.
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
		writer.writeStartArray();
		for( int i = 0, length = (int) nativeArray.getLength(); i < length; i++ )
		{
			Object value = nativeArray.get( i );
			BsonUtil.writeChild( value, writer, encoderContext, codecRegistry );
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

		Context context = Context.getCurrentContext();
		Scriptable scope = ScriptRuntime.getTopCallScope( context );
		NativeArray nativeArray = (NativeArray) context.newArray( scope, list.size() );

		int index = 0;
		for( Object item : list )
			ScriptableObject.putProperty( nativeArray, index++, item );
		return nativeArray;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final CodecRegistry codecRegistry;

	private final BsonTypeClassMap bsonTypeClassMap;
}
