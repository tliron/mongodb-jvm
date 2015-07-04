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

package com.mongodb.jvm.nashorn;

import org.bson.BsonReader;
import org.bson.BsonType;
import org.bson.BsonWriter;
import org.bson.codecs.BsonTypeClassMap;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.bson.codecs.configuration.CodecRegistry;

import com.threecrickets.jvm.json.nashorn.util.NashornNativeUtil;

import jdk.nashorn.internal.runtime.ScriptObject;
import jdk.nashorn.internal.runtime.Undefined;

/**
 * A BSON codec for a Nashorn {@link ScriptObject}.
 * 
 * @author Tal Liron
 */
public class ScriptObjectCodec implements Codec<ScriptObject>
{
	//
	// Construction
	//

	public ScriptObjectCodec( CodecRegistry codecRegistry, BsonTypeClassMap bsonTypeClassMap )
	{
		this.codecRegistry = codecRegistry;
		this.bsonTypeClassMap = bsonTypeClassMap;
	}

	//
	// Codec
	//

	public Class<ScriptObject> getEncoderClass()
	{
		return ScriptObject.class;
	}

	public void encode( BsonWriter writer, ScriptObject value, EncoderContext encoderContext )
	{
		writer.writeStartDocument();
		for( String key : value.getOwnKeys( true ) )
		{
			writer.writeName( key );
			Object entry = getProperty( value, key );
			BsonUtil.encodeChild( entry, writer, encoderContext, codecRegistry );
		}
		writer.writeEndDocument();
	}

	public ScriptObject decode( BsonReader reader, DecoderContext decoderContext )
	{
		ScriptObject object = NashornNativeUtil.newObject();

		reader.readStartDocument();
		while( reader.readBsonType() != BsonType.END_OF_DOCUMENT )
		{
			String key = reader.readName();
			object.put( key, BsonUtil.decode( reader, decoderContext, codecRegistry, bsonTypeClassMap ), false );
		}
		reader.readEndDocument();

		return object;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final CodecRegistry codecRegistry;

	private final BsonTypeClassMap bsonTypeClassMap;

	private static Object getProperty( ScriptObject scriptObject, String key )
	{
		Object value = scriptObject.get( key );
		if( value instanceof Undefined )
			return null;
		return value;
	}
}
